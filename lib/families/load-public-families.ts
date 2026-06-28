import { gedcomNameToDisplayName } from "@ligneous/album-view";
import { prisma } from "@/lib/database/prisma";
import { sourceToAlbumPath } from "@/lib/album/public-album-links";
import {
  GEDCOM_PLACE_DISPLAY_SELECT,
  fullPlaceLabelFromGedcomPlace,
  type GedcomPlaceDisplayRow,
} from "@/lib/gedcom-place-display";
import { resolveTreeFileUuid } from "@/lib/tree";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
  type IndividualDisplayPhotoMedia,
} from "@/lib/tree/individual-display-photo";
import { redactFamilyPartnerForViewer } from "@/lib/auth/living-person-privacy";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import type { DivorcedStatus, PublicFamily, PublicFamilyPartner } from "@/components/families/types";

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

const PUBLIC_FAMILY_LIST_SELECT = {
  id: true,
  xref: true,
  marriageDateDisplay: true,
  marriagePlaceDisplay: true,
  marriageYear: true,
  marriagePlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
  isDivorced: true,
  divorceDateId: true,
  childrenCount: true,
  husband: {
    select: { id: true, xref: true, fullName: true, sex: true, gender: true, isLiving: true },
  },
  wife: {
    select: { id: true, xref: true, fullName: true, sex: true, gender: true, isLiving: true },
  },
  familyEvents: {
    where: { event: { eventType: "DIV" } },
    take: 1,
    select: { id: true },
  },
} as const;

type PublicFamilyListRow = {
  id: string;
  xref: string;
  marriageDateDisplay: string | null;
  marriagePlaceDisplay: string | null;
  marriageYear: number | null;
  marriagePlace: GedcomPlaceDisplayRow | null;
  isDivorced: boolean;
  divorceDateId: string | null;
  childrenCount: number | null;
  husband: {
    id: string;
    xref: string;
    fullName: string | null;
    sex: string | null;
    gender: string | null;
    isLiving: boolean;
  } | null;
  wife: {
    id: string;
    xref: string;
    fullName: string | null;
    sex: string | null;
    gender: string | null;
    isLiving: boolean;
  } | null;
  familyEvents: { id: string }[];
};

function mapPublicFamilyListRow(
  row: PublicFamilyListRow,
  photoMap: Map<string, IndividualDisplayPhotoMedia>,
  viewer: Awaited<ReturnType<typeof resolvePublicViewer>>,
): PublicFamily {
  const partners = [row.husband, row.wife]
    .filter((item): item is NonNullable<typeof item> => item != null)
    .map((item) => partnerFromRow(item, photoMap))
    .map((partner) => redactFamilyPartnerForViewer(partner, viewer)!);
  const marriagePlaceLabel =
    fullPlaceLabelFromGedcomPlace(row.marriagePlace) ??
    row.marriagePlaceDisplay?.trim() ??
    null;
  const marriageDateLabel =
    row.marriageDateDisplay?.trim() || (row.marriageYear != null ? String(row.marriageYear) : null);

  return {
    id: row.id,
    xref: row.xref,
    title: familyTitle(partners),
    partners,
    childrenCount: row.childrenCount ?? 0,
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
  };
}

async function loadPublicFamilyListRows(
  fileUuid: string,
  options?: { ids?: string[] },
): Promise<PublicFamilyListRow[]> {
  if (options?.ids) {
    if (options.ids.length === 0) return [];
    const byId = (await prisma.gedcomFamily.findMany({
      where: { fileUuid, id: { in: options.ids } },
      select: PUBLIC_FAMILY_LIST_SELECT,
    })) as PublicFamilyListRow[];
    const order = new Map(options.ids.map((id, i) => [id, i]));
    return byId.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  return prisma.gedcomFamily.findMany({
    where: { fileUuid },
    orderBy: [{ marriageYear: "desc" }, { id: "asc" }],
    select: PUBLIC_FAMILY_LIST_SELECT,
  }) as Promise<PublicFamilyListRow[]>;
}

export async function loadPublicFamilies(): Promise<PublicFamily[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  const [rows, viewer] = await Promise.all([loadPublicFamilyListRows(fileUuid), resolvePublicViewer()]);
  const partnerIds = [
    ...new Set(
      rows.flatMap((row) => [row.husband?.id, row.wife?.id].filter((id): id is string => Boolean(id))),
    ),
  ];
  const photoMap = await batchIndividualDisplayPhotoMedia(prisma, fileUuid, partnerIds);
  return rows.map((row) => mapPublicFamilyListRow(row, photoMap, viewer));
}

export async function loadPublicFamiliesByIds(ids: string[]): Promise<PublicFamily[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid || ids.length === 0) return [];

  const [rows, viewer] = await Promise.all([
    loadPublicFamilyListRows(fileUuid, { ids }),
    resolvePublicViewer(),
  ]);
  const partnerIds = [
    ...new Set(
      rows.flatMap((row) => [row.husband?.id, row.wife?.id].filter((id): id is string => Boolean(id))),
    ),
  ];
  const photoMap = await batchIndividualDisplayPhotoMedia(prisma, fileUuid, partnerIds);
  return rows.map((row) => mapPublicFamilyListRow(row, photoMap, viewer));
}
