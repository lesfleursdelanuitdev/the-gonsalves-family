import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { fullPlaceLabelFromGedcomPlace, GEDCOM_PLACE_DISPLAY_SELECT } from "@/lib/gedcom-place-display";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import { formatNoteLinkedEventLabel } from "@ligneous/gedcom-events";
import type { PublicEvent, PublicEventProfile } from "@/components/events/types";

function familyTitle(
  husband: { fullName: string | null; xref: string } | null,
  wife: { fullName: string | null; xref: string } | null,
  xref: string,
): string {
  const names = [husband, wife]
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => formatGedcomFullNameForDisplay(p.fullName ?? p.xref));
  return names.length > 0 ? names.join(" & ") : xref;
}

const EVENT_LIST_SELECT = {
  id: true,
  eventType: true,
  customType: true,
  eventLabel: true,
  value: true,
  cause: true,
  date: { select: { original: true, year: true } },
  place: { select: { ...GEDCOM_PLACE_DISPLAY_SELECT, id: true } },
  individualEvents: {
    take: 1,
    select: { individual: { select: { id: true, fullName: true, xref: true } } },
  },
  familyEvents: {
    take: 1,
    select: {
      family: {
        select: {
          id: true,
          xref: true,
          husband: { select: { fullName: true, xref: true } },
          wife: { select: { fullName: true, xref: true } },
        },
      },
    },
  },
} as const;

type EventListRow = {
  id: string;
  eventType: string;
  customType: string | null;
  eventLabel: string | null;
  value: string | null;
  cause: string | null;
  date: { original: string | null; year: number | null } | null;
  place: { id: string; original: string; name: string | null; county: string | null; state: string | null; country: string | null } | null;
  individualEvents: { individual: { id: string; fullName: string | null; xref: string } }[];
  familyEvents: {
    family: {
      id: string;
      xref: string;
      husband: { fullName: string | null; xref: string } | null;
      wife: { fullName: string | null; xref: string } | null;
    };
  }[];
};

function mapEventRow(row: EventListRow): PublicEvent {
  const individual = row.individualEvents[0]?.individual ?? null;
  const family = row.familyEvents[0]?.family ?? null;

  let subjectName: string | null = null;
  let subjectHref: string | null = null;
  if (individual) {
    subjectName = formatGedcomFullNameForDisplay(individual.fullName ?? individual.xref);
    subjectHref = `/individuals/${individual.id}`;
  } else if (family) {
    subjectName = familyTitle(family.husband, family.wife, family.xref);
    subjectHref = `/families/${family.id}`;
  }

  return {
    id: row.id,
    eventType: row.eventType,
    typeLabel: formatNoteLinkedEventLabel(row.eventType, row.customType),
    customType: row.customType,
    eventLabel: row.eventLabel,
    value: row.value,
    cause: row.cause,
    dateLabel: row.date?.original?.trim() || null,
    year: row.date?.year ?? null,
    placeLabel: fullPlaceLabelFromGedcomPlace(row.place),
    placeHref: row.place ? `/tree/places/${row.place.id}` : null,
    subjectName,
    subjectHref,
    profileHref: `/tree/events/${row.id}`,
  };
}

export async function loadPublicEvents(): Promise<PublicEvent[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  const rows = (await prisma.gedcomEvent.findMany({
    where: { fileUuid },
    select: EVENT_LIST_SELECT,
    orderBy: [{ date: { year: "asc" } }, { id: "asc" }],
  })) as EventListRow[];

  return rows.map(mapEventRow);
}

export async function loadPublicEventById(id: string): Promise<PublicEventProfile | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const row = (await prisma.gedcomEvent.findFirst({
    where: { id, fileUuid },
    select: {
      ...EVENT_LIST_SELECT,
      eventNotes: {
        select: { note: { select: { content: true } } },
        orderBy: { id: "asc" },
      },
    },
  })) as (EventListRow & { eventNotes: { note: { content: string } }[] }) | null;

  if (!row) return null;

  return {
    ...mapEventRow(row),
    notes: row.eventNotes.map((n) => n.note.content),
  };
}
