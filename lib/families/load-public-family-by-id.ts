import { gedcomNameToDisplayName } from "@ligneous/album-view";
import { prisma } from "@/lib/database/prisma";
import { sourceToAlbumPath } from "@/lib/album/public-album-links";
import type {
  DivorcedStatus,
  PublicFamilyMember,
  PublicFamilyMemberRole,
  PublicFamilyPartner,
  PublicFamilyProfile,
} from "@/components/families/types";
import {
  GEDCOM_PLACE_DISPLAY_SELECT,
  fullPlaceLabelFromGedcomPlace,
  type GedcomPlaceDisplayRow,
} from "@/lib/gedcom-place-display";
import { buildFamilyTimeline } from "@/lib/families/build-family-timeline";
import { NOTE_LIVING_LINK_SELECT } from "@/lib/auth/living-note-privacy";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import {
  redactFamilyPartnerForViewer,
  redactPublicFamilyMembersForViewer,
} from "@/lib/auth/living-person-privacy";
import { mapPublicProfileNoteWithLivingPrivacy } from "@/lib/notes/map-note-living-privacy";
import { resolveTreeFileUuid } from "@/lib/tree";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
  type IndividualDisplayPhotoMedia,
} from "@/lib/tree/individual-display-photo";

function displayName(fullName: string | null | undefined, xref: string | null | undefined): string {
  return gedcomNameToDisplayName(fullName ?? null, xref ?? "") || xref || "Unknown";
}

function familyTitle(partners: PublicFamilyPartner[]): string {
  if (partners.length === 0) return "Family";
  if (partners.length === 1) return partners[0]!.fullName;
  return `${partners[0]!.fullName} & ${partners[1]!.fullName}`;
}

function resolveDivorcedStatus(args: {
  isDivorced: boolean;
  divorceDateId: string | null;
  hasDivorceEvent: boolean;
  marriageDateLabel: string | null;
  marriageYear: number | null;
}): DivorcedStatus {
  if (args.isDivorced || args.divorceDateId || args.hasDivorceEvent) return "yes";
  if (args.marriageDateLabel || args.marriageYear != null) return "no";
  return "unknown";
}

function partnerFromRow(
  row: {
    id: string;
    xref: string;
    fullName: string | null;
    sex: string | null;
    gender: string | null;
    isLiving: boolean;
  },
  photoMap: Map<string, IndividualDisplayPhotoMedia>,
): PublicFamilyPartner {
  return {
    id: row.id,
    xref: row.xref,
    fullName: displayName(row.fullName, row.xref),
    portraitSrc: individualDisplayPhotoMediaToPublicUrl(photoMap.get(row.id)),
    sex: row.sex ?? null,
    gender: row.gender ?? null,
    isLiving: row.isLiving,
  };
}

function dateLabel(display: string | null | undefined, year: number | null): string | null {
  return display?.trim() || (year != null ? String(year) : null);
}

async function batchMemberRelationCounts(
  fileUuid: string,
  memberIds: string[],
): Promise<Map<string, { partnersCount: number; childrenCount: number }>> {
  const out = new Map<string, { partnersCount: number; childrenCount: number }>();
  if (memberIds.length === 0) return out;

  for (const id of memberIds) {
    out.set(id, { partnersCount: 0, childrenCount: 0 });
  }

  const spouseFamilies = await prisma.gedcomFamily.findMany({
    where: {
      fileUuid,
      OR: [{ husbandId: { in: memberIds } }, { wifeId: { in: memberIds } }],
    },
    select: { husbandId: true, wifeId: true, childrenCount: true },
  });

  const partnerIdsByMember = new Map<string, Set<string>>();
  for (const id of memberIds) partnerIdsByMember.set(id, new Set());

  for (const fam of spouseFamilies) {
    if (fam.husbandId && fam.wifeId) {
      if (memberIds.includes(fam.husbandId)) partnerIdsByMember.get(fam.husbandId)?.add(fam.wifeId);
      if (memberIds.includes(fam.wifeId)) partnerIdsByMember.get(fam.wifeId)?.add(fam.husbandId);
    }
    if (fam.husbandId && memberIds.includes(fam.husbandId)) {
      const row = out.get(fam.husbandId)!;
      row.childrenCount += fam.childrenCount ?? 0;
    }
    if (fam.wifeId && memberIds.includes(fam.wifeId)) {
      const row = out.get(fam.wifeId)!;
      row.childrenCount += fam.childrenCount ?? 0;
    }
  }

  const parentChildGroups = await prisma.gedcomParentChild.groupBy({
    by: ["parentId"],
    where: { fileUuid, parentId: { in: memberIds } },
    _count: { childId: true },
  });
  for (const group of parentChildGroups) {
    const row = out.get(group.parentId);
    if (!row) continue;
    row.childrenCount = Math.max(row.childrenCount, group._count.childId);
  }

  for (const id of memberIds) {
    out.set(id, {
      partnersCount: partnerIdsByMember.get(id)?.size ?? 0,
      childrenCount: out.get(id)?.childrenCount ?? 0,
    });
  }

  return out;
}

const individualMemberSelect = {
  id: true,
  xref: true,
  fullName: true,
  birthYear: true,
  deathYear: true,
  birthDateDisplay: true,
  deathDateDisplay: true,
  sex: true,
  gender: true,
  isLiving: true,
} as const;

function memberFromIndividual(
  row: {
    id: string;
    xref: string;
    fullName: string | null;
    sex: string | null;
    gender: string | null;
    birthYear: number | null;
    deathYear: number | null;
    birthDateDisplay: string | null;
    deathDateDisplay: string | null;
    isLiving: boolean;
  },
  role: PublicFamilyMemberRole,
  photoMap: Map<string, IndividualDisplayPhotoMedia>,
  counts: Map<string, { partnersCount: number; childrenCount: number }>,
): PublicFamilyMember {
  const relationCounts = counts.get(row.id) ?? { partnersCount: 0, childrenCount: 0 };
  return {
    id: row.id,
    xref: row.xref,
    fullName: displayName(row.fullName, row.xref),
    role,
    sex: row.sex ?? null,
    gender: row.gender ?? null,
    birthDateLabel: dateLabel(row.birthDateDisplay, row.birthYear),
    deathDateLabel: row.deathYear != null ? dateLabel(row.deathDateDisplay, row.deathYear) : null,
    birthYear: row.birthYear ?? null,
    deathYear: row.deathYear ?? null,
    isLiving: row.isLiving,
    partnersCount: relationCounts.partnersCount,
    childrenCount: relationCounts.childrenCount,
    portraitSrc: individualDisplayPhotoMediaToPublicUrl(photoMap.get(row.id)),
    profileHref: `/individuals/${encodeURIComponent(row.id)}`,
  };
}

export async function loadPublicFamilyById(id: string): Promise<PublicFamilyProfile | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const row = await prisma.gedcomFamily.findFirst({
    where: { id, fileUuid },
    select: {
      id: true,
      xref: true,
      marriageDateDisplay: true,
      marriagePlaceDisplay: true,
      marriageYear: true,
      marriagePlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
      isDivorced: true,
      divorceDateId: true,
      childrenCount: true,
      husband: { select: individualMemberSelect },
      wife: { select: individualMemberSelect },
      familyChildren: {
        orderBy: [{ birthOrder: "asc" }, { createdAt: "asc" }],
        select: {
          child: { select: individualMemberSelect },
        },
      },
      familyEvents: {
        where: { event: { eventType: "DIV" } },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!row) return null;

  const childRows = row.familyChildren
    .map(({ child }) => child)
    .filter((child): child is NonNullable<typeof child> => child != null);

  const memberIds = [
    ...new Set([
      row.husband?.id,
      row.wife?.id,
      ...childRows.map((c) => c.id),
    ].filter((id): id is string => Boolean(id))),
  ];

  const photoMap = await batchIndividualDisplayPhotoMedia(prisma, fileUuid, memberIds);
  const counts = await batchMemberRelationCounts(fileUuid, memberIds);

  const partnersWithPhotos = [row.husband, row.wife]
    .filter((item): item is NonNullable<typeof item> => item != null)
    .map((item) => partnerFromRow(item, photoMap));

  const viewer = await resolvePublicViewer();

  const redactedPartners = partnersWithPhotos.map(
    (partner) => redactFamilyPartnerForViewer(partner, viewer)!,
  );

  const members: PublicFamilyMember[] = redactPublicFamilyMembersForViewer(
    [
      ...[row.husband, row.wife]
        .filter((item): item is NonNullable<typeof item> => item != null)
        .map((item) => memberFromIndividual(item, "Partner", photoMap, counts)),
      ...childRows.map((child) => memberFromIndividual(child, "Child", photoMap, counts)),
    ],
    viewer,
  );

  const marriagePlaceLabel =
    fullPlaceLabelFromGedcomPlace(row.marriagePlace as GedcomPlaceDisplayRow | null) ??
    row.marriagePlaceDisplay?.trim() ??
    null;
  const marriageDateLabel =
    row.marriageDateDisplay?.trim() || (row.marriageYear != null ? String(row.marriageYear) : null);

  const [timeline, noteRows] = await Promise.all([
    buildFamilyTimeline(
      fileUuid,
      row.id,
      members.map((m) => ({ id: m.id, fullName: m.fullName, role: m.role })),
      viewer,
    ),
    prisma.gedcomFamilyNote.findMany({
      where: { fileUuid, familyId: row.id },
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
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const notes = noteRows.map(({ note }) =>
    mapPublicProfileNoteWithLivingPrivacy(viewer, note, `/families/${encodeURIComponent(row.id)}#notes`),
  );

  return {
    id: row.id,
    xref: row.xref,
    title: familyTitle(redactedPartners),
    partners: redactedPartners,
    childrenCount: row.childrenCount ?? childRows.length,
    marriageDateLabel,
    marriagePlaceLabel,
    marriageYear: row.marriageYear ?? null,
    divorcedStatus: resolveDivorcedStatus({
      isDivorced: row.isDivorced,
      divorceDateId: row.divorceDateId,
      hasDivorceEvent: row.familyEvents.length > 0,
      marriageDateLabel,
      marriageYear: row.marriageYear ?? null,
    }),
    albumHref: sourceToAlbumPath({ type: "family", familyId: row.id }),
    profileHref: `/families/${encodeURIComponent(row.id)}`,
    members,
    timeline,
    notes,
  };
}
