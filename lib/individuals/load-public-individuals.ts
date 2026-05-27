import { collectMediaIdsForGenerated } from "@ligneous/album-generated-queries";
import { gedcomNameToDisplayName } from "@ligneous/album-view";
import { prisma } from "@/lib/database/prisma";
import {
  GEDCOM_PLACE_DISPLAY_SELECT,
  fullPlaceLabelFromGedcomPlace,
  type GedcomPlaceDisplayRow,
} from "@/lib/gedcom-place-display";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import {
  fetchIndividualIdsForGivenNameId,
  fetchIndividualIdsForGivenNamePrefix,
} from "@/lib/given-names/given-name-query";
import {
  fetchIndividualIdsForSurnameId,
  fetchIndividualIdsForSurnamePrefix,
} from "@/lib/surnames/surname-query";
import { resolveTreeFileUuid, resolveTreeId } from "@/lib/tree";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
  isRasterGedcomMediaForm,
} from "@/lib/tree/individual-display-photo";
import { personAgeYears } from "@/lib/individuals/person-age";
import { parentsHeaderLabelFromPedigreeRows } from "@/lib/tree/parents-label-for-family";
import type {
  PublicIndividual,
  PublicIndividualAssociate,
  PublicIndividualFamilyGroup,
  PublicIndividualLinkedAccount,
  PublicIndividualNote,
  PublicIndividualOpenQuestion,
  PublicIndividualProfile,
  PublicIndividualRelation,
  PublicIndividualRole,
  PublicIndividualTimelineItem,
} from "@/components/individuals/types";

type TimelineBuildItem = PublicIndividualTimelineItem & {
  sortYear: number | null;
  sortMonth: number;
  sortDay: number;
  sortPriority: number;
};
type IndividualDisplayPhotoMedia = Parameters<typeof individualDisplayPhotoMediaToPublicUrl>[0];

function inferRole(args: {
  sex: string | null;
  hasChildren: boolean;
  hasSpouse: boolean;
  hasParents: boolean;
}): PublicIndividualRole | null {
  const sex = (args.sex ?? "").toUpperCase();
  if (args.hasChildren && args.hasSpouse && sex === "M") return "Family Patriarch";
  if (args.hasChildren && args.hasSpouse && sex === "F") return "Family Matriarch";
  if (!args.hasChildren && args.hasParents && sex === "M") return "Son";
  if (!args.hasChildren && args.hasParents && sex === "F") return "Daughter";
  if (args.hasChildren || args.hasSpouse || args.hasParents) return "Ancestor";
  return null;
}

function displayName(fullName: string | null | undefined, xref: string | null | undefined): string {
  return gedcomNameToDisplayName(fullName ?? null, xref ?? "") || xref || "Unknown";
}

function rasterPublicUrl(fileRef: string | null | undefined, form: string | null | undefined): string | null {
  const ref = fileRef?.trim();
  if (!ref || !isRasterGedcomMediaForm(form)) return null;
  return resolveGedcomMediaFileRef(ref).trim() || null;
}

function lifeFragment(birthYear: number | null, deathYear: number | null): string {
  if (birthYear && deathYear) return `from ${birthYear} to ${deathYear}`;
  if (birthYear) return `from ${birthYear}`;
  if (deathYear) return `until ${deathYear}`;
  return "across the generations";
}

function buildBiography(args: {
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  birthPlace: string | null;
  occupation: string | null;
  nationality: string | null;
}): string {
  const place = args.birthPlace ? ` with roots in ${args.birthPlace}` : "";
  const work = args.occupation ? `, remembered in records as ${args.occupation}` : "";
  const nation = args.nationality ? ` and connected to ${args.nationality} heritage` : "";
  return `${args.name} is part of the Gonsalves family story, living ${lifeFragment(
    args.birthYear,
    args.deathYear,
  )}${place}${work}${nation}. Their profile gathers the dates, places, relationships, and media that help turn a record in the tree into a life remembered.`;
}

function eventTitle(eventType: string | null | undefined, customType: string | null | undefined): string {
  const type = (eventType ?? "").toUpperCase();
  if (type === "BIRT") return "Birth";
  if (type === "DEAT") return "Death";
  if (type === "MARR") return "Marriage";
  if (type === "BURI") return "Burial";
  if (type === "RESI") return "Residence";
  if (type === "OCCU") return "Occupation";
  if (type === "IMMI") return "Immigration";
  if (type === "EMIG") return "Emigration";
  if (type === "DIV") return "Divorce";
  if (type === "ANUL") return "Annulment";
  return customType?.trim() || eventType || "Life event";
}

function isWithinLifetime(year: number | null | undefined, birthYear: number | null, deathYear: number | null): year is number {
  if (year == null) return false;
  if (birthYear != null && year < birthYear) return false;
  if (deathYear != null && year > deathYear) return false;
  return true;
}

function dateLabelFromParts(original: string | null | undefined, year: number | null | undefined): string {
  return original?.trim() || (year != null ? String(year) : "Undated");
}

function fullPlaceLabel(
  place: GedcomPlaceDisplayRow | null | undefined,
  displayFallback?: string | null,
): string | null {
  return fullPlaceLabelFromGedcomPlace(place) ?? (displayFallback?.trim() || null);
}

function uniquePlaceLabels(labels: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const places: string[] = [];
  for (const label of labels) {
    const normalized = label?.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    places.push(normalized);
  }
  return places;
}

function pedigreeLabelFromParentChildRows(rows: { relationshipType: string | null; pedigree: string | null }[]): string | null {
  if (rows.length === 0) return null;
  const parentLabel = parentsHeaderLabelFromPedigreeRows(rows);
  const match = /\(([^)]+)\)/.exec(parentLabel);
  if (match?.[1]) return `Pedigree: ${match[1]}`;
  return "Pedigree: mixed";
}

function relationFromIndividual(
  row: {
    id: string;
    xref: string;
    fullName: string | null;
    birthYear: number | null;
    deathYear: number | null;
  },
  relationship: string,
  photoMap: Map<string, IndividualDisplayPhotoMedia>,
): PublicIndividualRelation {
  return {
    id: row.id,
    fullName: displayName(row.fullName, row.xref),
    birthYear: row.birthYear ?? null,
    deathYear: row.deathYear ?? null,
    portraitSrc: individualDisplayPhotoMediaToPublicUrl(photoMap.get(row.id)),
    relationship,
  };
}

function dateOnlyLabel(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function individualXrefVariants(xref: string): string[] {
  const trimmed = xref.trim();
  const bare = trimmed.replace(/^@+|@+$/g, "").trim();
  return [...new Set([trimmed, bare, bare ? `@${bare}@` : ""].filter(Boolean))];
}

function sortTimeline(items: TimelineBuildItem[]): PublicIndividualTimelineItem[] {
  return items
    .sort((a, b) => {
      const yearA = a.sortYear ?? Number.POSITIVE_INFINITY;
      const yearB = b.sortYear ?? Number.POSITIVE_INFINITY;
      if (yearA !== yearB) return yearA - yearB;
      if (a.sortMonth !== b.sortMonth) return a.sortMonth - b.sortMonth;
      if (a.sortDay !== b.sortDay) return a.sortDay - b.sortDay;
      return a.sortPriority - b.sortPriority;
    })
    .map((item) => ({
      id: item.id,
      dateLabel: item.dateLabel,
      title: item.title,
      place: item.place,
      description: item.description,
      context: item.context,
    }));
}

function relativeDeathTimelineItem(args: {
  relationship: "Parent" | "Sibling" | "Grandparent";
  personId: string;
  personName: string;
  deathYear: number | null;
  deathDateLabel: string | null;
  deathPlace: string | null;
  profileBirthYear: number | null;
  profileDeathYear: number | null;
}): TimelineBuildItem | null {
  if (!isWithinLifetime(args.deathYear, args.profileBirthYear, args.profileDeathYear)) return null;
  return {
    id: `${args.relationship.toLowerCase()}-death-${args.personId}`,
    dateLabel: args.deathDateLabel || String(args.deathYear),
    title: `Death of ${args.personName}`,
    place: args.deathPlace,
    description: `${args.relationship} death recorded during this person's lifetime.`,
    context: args.relationship,
    sortYear: args.deathYear,
    sortMonth: 0,
    sortDay: 0,
    sortPriority: args.relationship === "Parent" ? 20 : args.relationship === "Sibling" ? 30 : 40,
  };
}

function relativeVitalTimelineItem(args: {
  relationship: "Child" | "Grandchild";
  eventKind: "Birth" | "Death";
  personId: string;
  personName: string;
  year: number | null;
  dateLabel: string | null;
  place: string | null;
  profileBirthYear: number | null;
  profileDeathYear: number | null;
}): TimelineBuildItem | null {
  if (!isWithinLifetime(args.year, args.profileBirthYear, args.profileDeathYear)) return null;
  const kind = args.eventKind.toLowerCase();
  return {
    id: `${args.relationship.toLowerCase()}-${kind}-${args.personId}`,
    dateLabel: args.dateLabel || String(args.year),
    title: `${args.eventKind} of ${args.personName}`,
    place: args.place,
    description: `${args.relationship} ${kind} recorded during this person's lifetime.`,
    context: args.relationship,
    sortYear: args.year,
    sortMonth: 0,
    sortDay: 0,
    sortPriority:
      args.relationship === "Child"
        ? args.eventKind === "Birth"
          ? 50
          : 60
        : args.eventKind === "Birth"
          ? 70
          : 80,
  };
}

const PUBLIC_INDIVIDUAL_LIST_SELECT = {
  id: true,
  xref: true,
  fullName: true,
  birthYear: true,
  birthDateDisplay: true,
  birthPlaceDisplay: true,
  birthPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
  deathYear: true,
  deathDateDisplay: true,
  deathPlaceDisplay: true,
  deathPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
  ageAtDeath: true,
  hasChildren: true,
  hasParents: true,
  hasSpouse: true,
  sex: true,
  gender: true,
  individualEvents: {
    where: { event: { eventType: { in: ["RESI", "DEAT"] } } },
    select: {
      event: {
        select: {
          eventType: true,
          cause: true,
          date: { select: { year: true, month: true, day: true } },
          place: { select: GEDCOM_PLACE_DISPLAY_SELECT },
          value: true,
        },
      },
    },
  },
  familyPartnerships: {
    select: {
      family: { select: { childrenCount: true } },
    },
  },
};

type PublicIndividualListRow = {
  id: string;
  xref: string;
  fullName: string | null;
  birthYear: number | null;
  birthDateDisplay: string | null;
  birthPlaceDisplay: string | null;
  birthPlace: GedcomPlaceDisplayRow | null;
  deathYear: number | null;
  deathDateDisplay: string | null;
  deathPlaceDisplay: string | null;
  deathPlace: GedcomPlaceDisplayRow | null;
  ageAtDeath: number | null;
  hasChildren: boolean;
  hasParents: boolean;
  hasSpouse: boolean;
  sex: string | null;
  gender: string | null;
  individualEvents: Array<{
    event: {
      eventType: string;
      cause: string | null;
      date: { year: number | null; month: number | null; day: number | null } | null;
      place: GedcomPlaceDisplayRow | null;
      value: string | null;
    };
  }>;
  familyPartnerships: Array<{ family: { childrenCount: number } }>;
};

function hasRecordedDeathCause(
  individualEvents: PublicIndividualListRow["individualEvents"],
): boolean {
  return individualEvents.some(
    (link) => link.event.eventType.toUpperCase() === "DEAT" && Boolean(link.event.cause?.trim()),
  );
}

function mapPublicIndividualListRow(
  r: PublicIndividualListRow,
  photoMap: Map<string, IndividualDisplayPhotoMedia>,
): PublicIndividual {
  const residences = [...r.individualEvents]
    .filter(({ event }) => event.eventType.toUpperCase() === "RESI")
    .map(({ event }) => ({
      label: fullPlaceLabel(event.place, event.value),
      year: event.date?.year ?? Number.NEGATIVE_INFINITY,
      month: event.date?.month ?? 0,
      day: event.date?.day ?? 0,
    }))
    .filter((event): event is { label: string; year: number; month: number; day: number } => Boolean(event.label))
    .sort((a, b) => b.year - a.year || b.month - a.month || b.day - a.day);
  const placeLabels = uniquePlaceLabels([
    ...residences.map((event) => event.label),
    fullPlaceLabel(r.deathPlace, r.deathPlaceDisplay),
    fullPlaceLabel(r.birthPlace, r.birthPlaceDisplay),
  ]);
  const childrenCount = r.familyPartnerships.reduce((total, { family }) => total + family.childrenCount, 0);

  return {
    id: r.id,
    xref: r.xref,
    fullName: displayName(r.fullName, r.xref),
    birthYear: r.birthYear ?? null,
    deathYear: r.deathYear ?? null,
    currentLocationLabel: placeLabels[0] ?? null,
    placeLabels,
    age:
      r.ageAtDeath ??
      personAgeYears({
        birthDateLabel: r.birthDateDisplay ?? (r.birthYear != null ? String(r.birthYear) : null),
        birthYear: r.birthYear ?? null,
        deathDateLabel: r.deathDateDisplay ?? (r.deathYear != null ? String(r.deathYear) : null),
        deathYear: r.deathYear ?? null,
      }),
    childrenCount,
    role: inferRole({
      sex: r.sex ?? null,
      hasChildren: Boolean(r.hasChildren),
      hasSpouse: Boolean(r.hasSpouse),
      hasParents: Boolean(r.hasParents),
    }),
    gender: r.gender ?? null,
    sex: r.sex ?? null,
    hasPartner: Boolean(r.hasSpouse),
    hasChildren: Boolean(r.hasChildren),
    hasDeathCause: hasRecordedDeathCause(r.individualEvents),
    portraitSrc: individualDisplayPhotoMediaToPublicUrl(photoMap.get(r.id)),
  };
}

async function loadPublicIndividualListRows(
  fileUuid: string,
  options?: {
    lastName?: string;
    surnameId?: string;
    givenName?: string;
    givenNameId?: string;
    ids?: string[];
  },
): Promise<PublicIndividualListRow[]> {
  if (options?.ids) {
    if (options.ids.length === 0) return [];
    const byId = await prisma.gedcomIndividual.findMany({
      where: { id: { in: options.ids }, fileUuid },
      select: PUBLIC_INDIVIDUAL_LIST_SELECT,
    });
    const order = new Map(options.ids.map((id, i) => [id, i]));
    return byId.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)) as PublicIndividualListRow[];
  }

  if (options?.givenNameId?.trim()) {
    const ids = await fetchIndividualIdsForGivenNameId(options.givenNameId.trim());
    return loadPublicIndividualListRows(fileUuid, { ids });
  }

  if (options?.givenName?.trim()) {
    const ids = await fetchIndividualIdsForGivenNamePrefix(fileUuid, options.givenName);
    return loadPublicIndividualListRows(fileUuid, { ids });
  }

  if (options?.surnameId?.trim()) {
    const ids = await fetchIndividualIdsForSurnameId(options.surnameId.trim());
    return loadPublicIndividualListRows(fileUuid, { ids });
  }

  if (options?.lastName?.trim()) {
    const ids = await fetchIndividualIdsForSurnamePrefix(fileUuid, options.lastName);
    return loadPublicIndividualListRows(fileUuid, { ids });
  }

  return prisma.gedcomIndividual.findMany({
    where: { fileUuid },
    orderBy: [{ fullNameLower: "asc" }, { xref: "asc" }],
    select: PUBLIC_INDIVIDUAL_LIST_SELECT,
  }) as Promise<PublicIndividualListRow[]>;
}

export async function loadPublicIndividuals(options?: {
  lastName?: string;
  surnameId?: string;
  givenName?: string;
  givenNameId?: string;
}): Promise<PublicIndividual[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  const rows = await loadPublicIndividualListRows(fileUuid, options);

  const photoMap = await batchIndividualDisplayPhotoMedia(
    prisma,
    fileUuid,
    rows.map((r) => r.id),
  );

  return rows.map((r) => mapPublicIndividualListRow(r, photoMap));
}

export async function loadPublicIndividualsByIds(ids: string[]): Promise<PublicIndividual[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid || ids.length === 0) return [];

  const rows = await loadPublicIndividualListRows(fileUuid, { ids });
  const photoMap = await batchIndividualDisplayPhotoMedia(prisma, fileUuid, rows.map((r) => r.id));
  return rows.map((r) => mapPublicIndividualListRow(r, photoMap));
}

export async function loadPublicIndividualById(id: string): Promise<PublicIndividualProfile | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;
  const treeId = await resolveTreeId();

  const r = await prisma.gedcomIndividual.findFirst({
    where: { id, fileUuid },
    select: {
      id: true,
      xref: true,
      fullName: true,
      birthYear: true,
      deathYear: true,
      birthDateDisplay: true,
      birthPlaceDisplay: true,
      birthPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
      deathDateDisplay: true,
      deathPlaceDisplay: true,
      deathPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
      ageAtDeath: true,
      hasChildren: true,
      hasParents: true,
      hasSpouse: true,
      sex: true,
      gender: true,
      religion: true,
      occupation: true,
      nationality: true,
    },
  });
  if (!r) return null;

  const role = inferRole({
    sex: r.sex ?? null,
    hasChildren: Boolean(r.hasChildren),
    hasSpouse: Boolean(r.hasSpouse),
    hasParents: Boolean(r.hasParents),
  });
  const name = displayName(r.fullName, r.xref);

  const originFamilyLinks = await prisma.gedcomFamilyChild.findMany({
    where: { fileUuid, childId: r.id },
    select: {
      family: {
        select: {
          id: true,
          xref: true,
          husband: { select: { id: true, xref: true, fullName: true, birthYear: true, deathYear: true } },
          wife: { select: { id: true, xref: true, fullName: true, birthYear: true, deathYear: true } },
          familyChildren: {
            orderBy: [{ birthOrder: "asc" }],
            select: {
              child: { select: { id: true, xref: true, fullName: true, birthYear: true, deathYear: true } },
            },
          },
        },
      },
    },
  });
  const partnerFamilyRows = await prisma.gedcomFamily.findMany({
    where: { fileUuid, OR: [{ husbandId: r.id }, { wifeId: r.id }] },
    select: {
      id: true,
      xref: true,
      husbandId: true,
      wifeId: true,
      husband: { select: { id: true, xref: true, fullName: true, birthYear: true, deathYear: true } },
      wife: { select: { id: true, xref: true, fullName: true, birthYear: true, deathYear: true } },
      familyChildren: {
        orderBy: [{ birthOrder: "asc" }],
        select: {
          child: {
            select: {
              id: true,
              xref: true,
              fullName: true,
              birthYear: true,
              birthDateDisplay: true,
              birthPlaceDisplay: true,
              birthPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
              deathYear: true,
              deathDateDisplay: true,
              deathPlaceDisplay: true,
              deathPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
            },
          },
        },
      },
      familyEvents: {
        select: {
          event: {
            select: {
              id: true,
              eventType: true,
              customType: true,
              value: true,
              date: { select: { original: true, year: true, month: true, day: true } },
              place: { select: GEDCOM_PLACE_DISPLAY_SELECT },
            },
          },
        },
      },
    },
  });

  const directEventRows = await prisma.gedcomIndividualEvent.findMany({
    where: { fileUuid, individualId: r.id },
    select: {
      event: {
        select: {
          id: true,
          eventType: true,
          customType: true,
          value: true,
          date: { select: { original: true, year: true, month: true, day: true } },
          place: { select: GEDCOM_PLACE_DISPLAY_SELECT },
        },
      },
    },
  });

  const timelineItems: TimelineBuildItem[] = directEventRows
    .map<TimelineBuildItem | null>(({ event }) => {
      const year = event.date?.year ?? null;
      const title = eventTitle(event.eventType, event.customType);
      if (title === "Life event") return null;
      const place = fullPlaceLabel(event.place);
      return {
        id: `direct-${event.id}`,
        dateLabel: dateLabelFromParts(event.date?.original, year),
        title,
        place,
        description: event.value?.trim() || (place ? `${title} recorded in ${place}.` : `${title} recorded in the family tree.`),
        context: "Personal event" as const,
        sortYear: year,
        sortMonth: event.date?.month ?? 0,
        sortDay: event.date?.day ?? 0,
        sortPriority: 10,
      };
    })
    .filter((item): item is TimelineBuildItem => item != null);

  const parentRows = await prisma.gedcomParentChild.findMany({
    where: { fileUuid, childId: r.id },
    select: {
      familyId: true,
      relationshipType: true,
      pedigree: true,
      parent: {
        select: {
          id: true,
          xref: true,
          fullName: true,
          birthYear: true,
          deathYear: true,
          deathDateDisplay: true,
          deathPlaceDisplay: true,
          deathPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
        },
      },
    },
  });
  const originFamilyIds = [...new Set(parentRows.map((row) => row.familyId).filter((id): id is string => Boolean(id)))];
  const parentIds = [...new Set(parentRows.map((row) => row.parent.id))];
  const pedigreeRowsByFamilyId = new Map<string, { relationshipType: string | null; pedigree: string | null }[]>();
  for (const row of parentRows) {
    if (!row.familyId) continue;
    const rows = pedigreeRowsByFamilyId.get(row.familyId) ?? [];
    rows.push({ relationshipType: row.relationshipType ?? null, pedigree: row.pedigree ?? null });
    pedigreeRowsByFamilyId.set(row.familyId, rows);
  }
  let siblingRows: {
    child: {
      id: string;
      xref: string;
      fullName: string | null;
      birthYear: number | null;
      deathYear: number | null;
      deathDateDisplay: string | null;
      deathPlaceDisplay: string | null;
      deathPlace: GedcomPlaceDisplayRow | null;
    };
  }[] = [];

  for (const row of parentRows) {
    const item = relativeDeathTimelineItem({
      relationship: "Parent",
      personId: row.parent.id,
      personName: displayName(row.parent.fullName, row.parent.xref),
      deathYear: row.parent.deathYear ?? null,
      deathDateLabel: row.parent.deathDateDisplay ?? null,
      deathPlace: fullPlaceLabel(row.parent.deathPlace, row.parent.deathPlaceDisplay),
      profileBirthYear: r.birthYear ?? null,
      profileDeathYear: r.deathYear ?? null,
    });
    if (item) timelineItems.push(item);
  }

  if (originFamilyIds.length > 0) {
    siblingRows = await prisma.gedcomParentChild.findMany({
      where: { fileUuid, familyId: { in: originFamilyIds }, childId: { not: r.id } },
      distinct: ["childId"],
      select: {
        child: {
          select: {
            id: true,
            xref: true,
            fullName: true,
            birthYear: true,
            deathYear: true,
            deathDateDisplay: true,
            deathPlaceDisplay: true,
            deathPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
          },
        },
      },
    });
    for (const row of siblingRows) {
      const item = relativeDeathTimelineItem({
        relationship: "Sibling",
        personId: row.child.id,
        personName: displayName(row.child.fullName, row.child.xref),
        deathYear: row.child.deathYear ?? null,
        deathDateLabel: row.child.deathDateDisplay ?? null,
        deathPlace: fullPlaceLabel(row.child.deathPlace, row.child.deathPlaceDisplay),
        profileBirthYear: r.birthYear ?? null,
        profileDeathYear: r.deathYear ?? null,
      });
      if (item) timelineItems.push(item);
    }
  }

  const xrefVariants = individualXrefVariants(r.xref);
  const [noteRows, associationRows, openQuestionRows, linkedAccountRows] = await Promise.all([
    prisma.gedcomIndividualNote.findMany({
      where: { fileUuid, individualId: r.id },
      select: {
        note: { select: { id: true, xref: true, content: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.individualRelationship.findMany({
      where: {
        fileUuid,
        participants: { some: { individualId: r.id } },
      },
      include: {
        relationshipType: true,
        participants: {
          include: {
            individual: { select: { id: true, xref: true, fullName: true, birthYear: true, deathYear: true } },
            role: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.openQuestionIndividual.findMany({
      where: { individualId: r.id },
      select: {
        openQuestion: {
          select: {
            id: true,
            question: true,
            details: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { openQuestion: { createdAt: "desc" } },
    }),
    treeId
      ? prisma.userIndividualLink.findMany({
          where: {
            treeId,
            individualXref: { in: xrefVariants },
            user: { isActive: true },
          },
          select: {
            id: true,
            verified: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
          orderBy: [{ verified: "desc" }, { createdAt: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  const familyRelationIds = new Set<string>([r.id]);
  for (const row of parentRows) familyRelationIds.add(row.parent.id);
  for (const row of siblingRows) familyRelationIds.add(row.child.id);
  for (const rel of associationRows) {
    for (const p of rel.participants) {
      if (p.individualId !== r.id) familyRelationIds.add(p.individualId);
    }
  }
  for (const { family } of originFamilyLinks) {
    if (family.husband) familyRelationIds.add(family.husband.id);
    if (family.wife) familyRelationIds.add(family.wife.id);
    for (const { child } of family.familyChildren) familyRelationIds.add(child.id);
  }
  for (const family of partnerFamilyRows) {
    if (family.husband) familyRelationIds.add(family.husband.id);
    if (family.wife) familyRelationIds.add(family.wife.id);
    for (const { child } of family.familyChildren) familyRelationIds.add(child.id);
  }
  const familyPhotoMap = await batchIndividualDisplayPhotoMedia(prisma, fileUuid, [...familyRelationIds]);
  const uniqueRelations = (items: PublicIndividualRelation[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const familiesAsChild: PublicIndividualFamilyGroup[] = originFamilyLinks.map(({ family }) => {
    const parentsInFamily = [
      family.husband ? relationFromIndividual(family.husband, "Parent", familyPhotoMap) : null,
      family.wife ? relationFromIndividual(family.wife, "Parent", familyPhotoMap) : null,
    ].filter((item): item is PublicIndividualRelation => item != null);
    const childrenInFamily = family.familyChildren.map(({ child }) =>
      relationFromIndividual(child, child.id === r.id ? "Profile person" : "Sibling", familyPhotoMap),
    );
    return {
      id: family.id,
      xref: family.xref,
      pedigreeLabel: pedigreeLabelFromParentChildRows(pedigreeRowsByFamilyId.get(family.id) ?? []),
      parents: parentsInFamily,
      partners: [],
      children: childrenInFamily,
      childrenCount: childrenInFamily.length,
    };
  });
  const familiesAsPartner: PublicIndividualFamilyGroup[] = partnerFamilyRows.map((family) => {
    const partnersInFamily = [family.husband, family.wife]
      .filter((item): item is NonNullable<typeof item> => item != null && item.id !== r.id)
      .map((item) => relationFromIndividual(item, "Partner", familyPhotoMap));
    const childrenInFamily = family.familyChildren.map(({ child }) =>
      relationFromIndividual(child, "Child", familyPhotoMap),
    );
    return {
      id: family.id,
      xref: family.xref,
      pedigreeLabel: null,
      parents: [],
      partners: partnersInFamily,
      children: childrenInFamily,
      childrenCount: childrenInFamily.length,
    };
  });
  const parents = uniqueRelations(familiesAsChild.flatMap((family) => family.parents));
  const siblings = uniqueRelations(
    familiesAsChild
      .flatMap((family) => family.children)
      .filter((relation) => relation.id !== r.id)
      .map((relation) => ({ ...relation, relationship: "Sibling" })),
  );
  const partners = uniqueRelations(familiesAsPartner.flatMap((family) => family.partners));
  const partner = partners[0] ?? null;
  const children = uniqueRelations(familiesAsPartner.flatMap((family) => family.children));
  const notes: PublicIndividualNote[] = noteRows.map(({ note }) => ({
    id: note.id,
    xref: note.xref ?? null,
    content: note.content,
  }));
  const associatesById = new Map<string, PublicIndividualAssociate>();
  for (const rel of associationRows) {
    const others = rel.participants.filter((p) => p.individualId !== r.id);
    for (const other of others) {
      if (associatesById.has(other.individualId)) continue;
      const relationLabel = other.role.label || rel.relationshipType.label;
      const item: PublicIndividualAssociate = {
        ...relationFromIndividual(other.individual, relationLabel, familyPhotoMap),
        relationLabel,
      };
      associatesById.set(other.individualId, item);
    }
  }
  const associates = [...associatesById.values()];
  const openQuestions: PublicIndividualOpenQuestion[] = openQuestionRows.map(({ openQuestion }) => ({
    id: openQuestion.id,
    question: openQuestion.question,
    details: openQuestion.details ?? null,
    status: String(openQuestion.status),
    createdAtLabel: dateOnlyLabel(openQuestion.createdAt),
  }));
  const linkedAccounts: PublicIndividualLinkedAccount[] = linkedAccountRows.map((link) => ({
    id: link.user.id,
    displayName: link.user.profile?.displayName?.trim() || link.user.name?.trim() || link.user.username,
    username: link.user.username,
    verified: link.verified,
    linkedAtLabel: dateOnlyLabel(link.createdAt),
  }));
  const childRows = [
    ...new Map(
      partnerFamilyRows
        .flatMap((family) => family.familyChildren.map(({ child }) => [child.id, child] as const))
    ).values(),
  ];

  for (const child of childRows) {
    const childName = displayName(child.fullName, child.xref);
    const birthItem = relativeVitalTimelineItem({
      relationship: "Child",
      eventKind: "Birth",
      personId: child.id,
      personName: childName,
      year: child.birthYear ?? null,
      dateLabel: child.birthDateDisplay ?? null,
      place: fullPlaceLabel(child.birthPlace, child.birthPlaceDisplay),
      profileBirthYear: r.birthYear ?? null,
      profileDeathYear: r.deathYear ?? null,
    });
    if (birthItem) timelineItems.push(birthItem);

    const deathItem = relativeVitalTimelineItem({
      relationship: "Child",
      eventKind: "Death",
      personId: child.id,
      personName: childName,
      year: child.deathYear ?? null,
      dateLabel: child.deathDateDisplay ?? null,
      place: fullPlaceLabel(child.deathPlace, child.deathPlaceDisplay),
      profileBirthYear: r.birthYear ?? null,
      profileDeathYear: r.deathYear ?? null,
    });
    if (deathItem) timelineItems.push(deathItem);
  }

  const grandchildRows =
    childRows.length > 0
      ? await prisma.gedcomParentChild.findMany({
          where: { fileUuid, parentId: { in: childRows.map((child) => child.id) } },
          distinct: ["childId"],
          select: {
            child: {
              select: {
                id: true,
                xref: true,
                fullName: true,
                birthYear: true,
                birthDateDisplay: true,
                birthPlaceDisplay: true,
                birthPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
                deathYear: true,
                deathDateDisplay: true,
                deathPlaceDisplay: true,
                deathPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
              },
            },
          },
        })
      : [];

  for (const row of grandchildRows) {
    const grandchild = row.child;
    const grandchildName = displayName(grandchild.fullName, grandchild.xref);
    const birthItem = relativeVitalTimelineItem({
      relationship: "Grandchild",
      eventKind: "Birth",
      personId: grandchild.id,
      personName: grandchildName,
      year: grandchild.birthYear ?? null,
      dateLabel: grandchild.birthDateDisplay ?? null,
      place: fullPlaceLabel(grandchild.birthPlace, grandchild.birthPlaceDisplay),
      profileBirthYear: r.birthYear ?? null,
      profileDeathYear: r.deathYear ?? null,
    });
    if (birthItem) timelineItems.push(birthItem);

    const deathItem = relativeVitalTimelineItem({
      relationship: "Grandchild",
      eventKind: "Death",
      personId: grandchild.id,
      personName: grandchildName,
      year: grandchild.deathYear ?? null,
      dateLabel: grandchild.deathDateDisplay ?? null,
      place: fullPlaceLabel(grandchild.deathPlace, grandchild.deathPlaceDisplay),
      profileBirthYear: r.birthYear ?? null,
      profileDeathYear: r.deathYear ?? null,
    });
    if (deathItem) timelineItems.push(deathItem);
  }

  for (const family of partnerFamilyRows) {
    const partnerNames = [family.husband, family.wife]
      .filter((item): item is NonNullable<typeof item> => item != null && item.id !== r.id)
      .map((item) => displayName(item.fullName, item.xref));
    const familyLabel = partnerNames.length > 0 ? ` with ${partnerNames.join(", ")}` : "";
    for (const { event } of family.familyEvents) {
      const year = event.date?.year ?? null;
      const title = eventTitle(event.eventType, event.customType);
      if (title === "Life event") continue;
      const place = fullPlaceLabel(event.place);
      timelineItems.push({
        id: `family-${family.id}-${event.id}`,
        dateLabel: dateLabelFromParts(event.date?.original, year),
        title,
        place,
        description:
          event.value?.trim() ||
          (place
            ? `${title} for the family${familyLabel} recorded in ${place}.`
            : `${title} for the family${familyLabel} recorded in the family tree.`),
        context: "Family",
        sortYear: year,
        sortMonth: event.date?.month ?? 0,
        sortDay: event.date?.day ?? 0,
        sortPriority: 45,
      });
    }
  }

  if (parentIds.length > 0) {
    const grandparentRows = await prisma.gedcomParentChild.findMany({
      where: { fileUuid, childId: { in: parentIds } },
      distinct: ["parentId"],
      select: {
        parent: {
          select: {
            id: true,
            xref: true,
            fullName: true,
            deathYear: true,
            deathDateDisplay: true,
            deathPlaceDisplay: true,
            deathPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
          },
        },
      },
    });
    for (const row of grandparentRows) {
      const item = relativeDeathTimelineItem({
        relationship: "Grandparent",
        personId: row.parent.id,
        personName: displayName(row.parent.fullName, row.parent.xref),
        deathYear: row.parent.deathYear ?? null,
        deathDateLabel: row.parent.deathDateDisplay ?? null,
        deathPlace: fullPlaceLabel(row.parent.deathPlace, row.parent.deathPlaceDisplay),
        profileBirthYear: r.birthYear ?? null,
        profileDeathYear: r.deathYear ?? null,
      });
      if (item) timelineItems.push(item);
    }
  }

  const collected = await collectMediaIdsForGenerated(prisma, fileUuid, {
    type: "individual",
    individualId: r.id,
  });
  const mediaRows =
    collected.mediaIds.length > 0
      ? await prisma.gedcomMedia.findMany({
          where: { id: { in: [...new Set(collected.mediaIds)].slice(0, 8) }, fileUuid },
          select: { id: true, title: true, fileRef: true, form: true },
        })
      : [];
  const mediaById = new Map(mediaRows.map((m) => [m.id, m]));
  const photos = [...new Set(collected.mediaIds)]
    .map((mediaId) => mediaById.get(mediaId))
    .filter((m): m is NonNullable<typeof m> => m != null)
    .map((m) => ({ id: m.id, title: m.title?.trim() || "Family photo", src: rasterPublicUrl(m.fileRef, m.form) }))
    .filter((m): m is { id: string; title: string; src: string } => Boolean(m.src))
    .slice(0, 6);
  const birthPlace = fullPlaceLabel(r.birthPlace, r.birthPlaceDisplay);
  const deathPlace = fullPlaceLabel(r.deathPlace, r.deathPlaceDisplay);
  const placeLabels = uniquePlaceLabels([
    ...directEventRows
      .filter(({ event }) => event.eventType.toUpperCase() === "RESI")
      .sort((a, b) => {
        const aDate = a.event.date;
        const bDate = b.event.date;
        return (
          (bDate?.year ?? Number.NEGATIVE_INFINITY) - (aDate?.year ?? Number.NEGATIVE_INFINITY) ||
          (bDate?.month ?? 0) - (aDate?.month ?? 0) ||
          (bDate?.day ?? 0) - (aDate?.day ?? 0)
        );
      })
      .map(({ event }) => fullPlaceLabel(event.place, event.value)),
    deathPlace,
    birthPlace,
  ]);
  const photoMap = familyPhotoMap;

  return {
    id: r.id,
    xref: r.xref,
    fullName: name,
    birthYear: r.birthYear ?? null,
    deathYear: r.deathYear ?? null,
    currentLocationLabel: placeLabels[0] ?? null,
    placeLabels,
    age:
      r.ageAtDeath ??
      personAgeYears({
        birthDateLabel: r.birthDateDisplay ?? (r.birthYear ? String(r.birthYear) : null),
        birthYear: r.birthYear ?? null,
        deathDateLabel: r.deathDateDisplay ?? (r.deathYear ? String(r.deathYear) : null),
        deathYear: r.deathYear ?? null,
      }),
    childrenCount: children.length,
    role,
    portraitSrc: individualDisplayPhotoMediaToPublicUrl(photoMap.get(r.id)),
    biography: buildBiography({
      name,
      birthYear: r.birthYear ?? null,
      deathYear: r.deathYear ?? null,
      birthPlace,
      occupation: r.occupation ?? null,
      nationality: r.nationality ?? null,
    }),
    birthDateLabel: r.birthDateDisplay ?? (r.birthYear ? String(r.birthYear) : null),
    birthPlace,
    deathDateLabel: r.deathDateDisplay ?? (r.deathYear ? String(r.deathYear) : null),
    deathPlace,
    gender: r.gender ?? (r.sex ? String(r.sex) : null),
    sex: r.sex ?? null,
    hasPartner: Boolean(r.hasSpouse),
    hasChildren: Boolean(r.hasChildren),
    religion: r.religion ?? null,
    occupation: r.occupation ?? null,
    nationality: r.nationality ?? null,
    partner,
    partners,
    spouse: partner,
    spouses: partners,
    parents,
    siblings,
    children,
    familiesAsChild,
    familiesAsPartner,
    timeline: sortTimeline(timelineItems),
    photos,
    notes,
    associates,
    openQuestions,
    linkedAccounts,
  };
}
