import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import { fullPlaceLabelFromGedcomPlace, GEDCOM_PLACE_DISPLAY_SELECT } from "@/lib/gedcom-place-display";
import { prisma } from "@/lib/database/prisma";
import type { Prisma } from "@ligneous/prisma";
import type { EventLivingLinkInput } from "@/lib/auth/living-event-privacy";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import {
  applyLivingPrivacyToPublicEvent,
  eventLoginPath,
} from "@/lib/events/map-event-living-privacy";
import { NOTE_LIVING_LINK_SELECT, type NoteLivingLinkInput } from "@/lib/auth/living-note-privacy";
import { mapPublicProfileNoteWithLivingPrivacy } from "@/lib/notes/map-note-living-privacy";
import { resolveTreeFileUuid } from "@/lib/tree";
import { formatNoteLinkedEventLabel, resolveEventPrimaryParticipants } from "@ligneous/gedcom-events";
import type { PublicViewer } from "@/lib/auth/public-viewer-context";
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
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      participantKind: true,
      role: true,
      sortOrder: true,
      individual: { select: { id: true, fullName: true, xref: true, isLiving: true } },
    },
  },
  familyEvents: {
    orderBy: { createdAt: "asc" },
    select: {
      family: {
        select: {
          id: true,
          xref: true,
          husband: { select: { id: true, fullName: true, xref: true, isLiving: true } },
          wife: { select: { id: true, fullName: true, xref: true, isLiving: true } },
        },
      },
    },
  },
} satisfies Prisma.GedcomEventSelect;

type EventListRow = Prisma.GedcomEventGetPayload<{ select: typeof EVENT_LIST_SELECT }>;

const EVENT_DETAIL_SELECT = {
  ...EVENT_LIST_SELECT,
  eventNotes: {
    select: {
      note: {
        select: {
          id: true,
          xref: true,
          content: true,
          ...NOTE_LIVING_LINK_SELECT,
        },
      },
    },
    orderBy: { id: "asc" },
  },
} satisfies Prisma.GedcomEventSelect;

function eventLivingLinks(row: EventListRow): EventLivingLinkInput {
  return {
    individualEvents: row.individualEvents.map((link) => ({
      individual: { id: link.individual.id, isLiving: link.individual.isLiving },
    })),
    familyEvents: row.familyEvents.map((link) => ({
      family: {
        husband: link.family.husband
          ? { id: link.family.husband.id, isLiving: link.family.husband.isLiving }
          : null,
        wife: link.family.wife ? { id: link.family.wife.id, isLiving: link.family.wife.isLiving } : null,
      },
    })),
  };
}

function mapEventRow(row: EventListRow, viewer: PublicViewer): PublicEvent {
  const resolved = resolveEventPrimaryParticipants({
    individualEvents: row.individualEvents,
    familyEvents: row.familyEvents,
  });

  let subjectName: string | null = null;
  let subjectHref: string | null = null;

  if (resolved.source === "family-partners") {
    const family = row.familyEvents[0]?.family;
    if (family) {
      subjectName = familyTitle(family.husband, family.wife, family.xref);
      subjectHref = `/families/${family.id}`;
    }
  } else if (resolved.individuals[0]) {
    const primary = resolved.individuals[0];
    subjectName = formatGedcomFullNameForDisplay(primary.fullName ?? primary.xref ?? null);
    subjectHref = `/individuals/${primary.id}`;
  }

  const base: PublicEvent = {
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
    profileHref: eventLoginPath(row.id),
    privacyRestricted: false,
    loginHref: null,
  };

  return applyLivingPrivacyToPublicEvent(viewer, base, eventLivingLinks(row));
}

export async function loadPublicEvents(): Promise<PublicEvent[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  const viewer = await resolvePublicViewer();

  const rows = await prisma.gedcomEvent.findMany({
    where: { fileUuid },
    select: EVENT_LIST_SELECT,
    orderBy: [{ date: { year: "asc" } }, { id: "asc" }],
  });

  return rows.map((row) => mapEventRow(row, viewer));
}

export async function loadPublicEventById(id: string): Promise<PublicEventProfile | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const row = await prisma.gedcomEvent.findFirst({
    where: { id, fileUuid },
    select: EVENT_DETAIL_SELECT,
  });

  if (!row) return null;

  const viewer = await resolvePublicViewer();
  const loginPath = eventLoginPath(row.id);
  const mapped = mapEventRow(row, viewer);

  return {
    ...mapped,
    notes: row.eventNotes.map(({ note }) =>
      mapPublicProfileNoteWithLivingPrivacy(viewer, note as NoteLivingLinkInput & { id: string; xref: string | null; content: string }, loginPath),
    ),
  };
}
