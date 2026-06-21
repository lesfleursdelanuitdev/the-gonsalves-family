import type { PrismaClient } from "@ligneous/prisma";
import { NextResponse } from "next/server";
import { authRequiredResponse } from "@/lib/auth/auth-required-response";
import { LIVING_MEDIA_PLACEHOLDER_COVER } from "@/lib/auth/living-media-constants";
import { buildLoginWallPath } from "@/lib/auth/public-viewer";
import { canViewFullIndividual, isAuthenticatedViewer, type PublicViewer } from "@/lib/auth/public-viewer";

export { LIVING_MEDIA_PLACEHOLDER_COVER };

const LINKED_PERSON_SELECT = { id: true, isLiving: true } as const;

const FAMILY_PARTNERS_SELECT = {
  husband: { select: LINKED_PERSON_SELECT },
  wife: { select: LINKED_PERSON_SELECT },
} as const;

export const MEDIA_LIVING_LINK_SELECT = {
  individualMedia: {
    select: { individual: { select: LINKED_PERSON_SELECT } },
  },
  individualProfileFor: {
    select: { individual: { select: LINKED_PERSON_SELECT } },
  },
  familyMedia: {
    select: { family: { select: FAMILY_PARTNERS_SELECT } },
  },
  familyProfileFor: {
    select: { family: { select: FAMILY_PARTNERS_SELECT } },
  },
} as const;

type LinkedPerson = { id: string; isLiving: boolean };

type FamilyPartners = {
  husband: LinkedPerson | null;
  wife: LinkedPerson | null;
};

export type MediaLivingLinkInput = {
  individualMedia: Array<{ individual: LinkedPerson }>;
  individualProfileFor: Array<{ individual: LinkedPerson }>;
  familyMedia: Array<{ family: FamilyPartners }>;
  familyProfileFor?: Array<{ family: FamilyPartners }>;
};

function addLinkedPerson(map: Map<string, boolean>, person: LinkedPerson | null | undefined): void {
  if (!person?.id) return;
  map.set(person.id, person.isLiving);
}

export function collectLinkedPeople(input: MediaLivingLinkInput): Map<string, boolean> {
  const byId = new Map<string, boolean>();
  for (const link of input.individualMedia) addLinkedPerson(byId, link.individual);
  for (const link of input.individualProfileFor) addLinkedPerson(byId, link.individual);
  for (const link of input.familyMedia) {
    addLinkedPerson(byId, link.family.husband);
    addLinkedPerson(byId, link.family.wife);
  }
  for (const link of input.familyProfileFor ?? []) {
    addLinkedPerson(byId, link.family.husband);
    addLinkedPerson(byId, link.family.wife);
  }
  return byId;
}

/** Collect husband/wife from a family row (generated family scrapbooks, indirect links). */
export function collectFamilyPartners(family: FamilyPartners): Map<string, boolean> {
  const byId = new Map<string, boolean>();
  addLinkedPerson(byId, family.husband);
  addLinkedPerson(byId, family.wife);
  return byId;
}

export function isFamilyAllLivingPartners(family: FamilyPartners): boolean {
  return areAllLinkedPeopleLiving(collectFamilyPartners(family));
}

export function canViewLivingFamilyGeneratedAlbum(viewer: PublicViewer, family: FamilyPartners): boolean {
  if (!isFamilyAllLivingPartners(family)) return true;
  return isAuthenticatedViewer(viewer);
}

/** True when the entity links to at least one person and every linked person is living. */
export function areAllLinkedPeopleLiving(people: Map<string, boolean>): boolean {
  if (people.size === 0) return false;
  return [...people.values()].every((isLiving) => isLiving);
}

export function isMediaLinkedOnlyToLivingPeople(input: MediaLivingLinkInput): boolean {
  return areAllLinkedPeopleLiving(collectLinkedPeople(input));
}

export function shouldGateAllLivingLinkedEntity(viewer: PublicViewer, allLinkedLiving: boolean): boolean {
  return allLinkedLiving && !isAuthenticatedViewer(viewer);
}

/** @deprecated Use shouldGateAllLivingLinkedEntity */
export const shouldGateExclusiveLivingMedia = shouldGateAllLivingLinkedEntity;

/** @deprecated Use isMediaLinkedOnlyToLivingPeople */
export function isMediaExclusivelyLinkedToLivingPeople(
  input: MediaLivingLinkInput & { _count?: Record<string, number> },
): boolean {
  return isMediaLinkedOnlyToLivingPeople(input);
}

export async function isGedcomMediaLinkedOnlyToLivingPeople(
  prisma: PrismaClient,
  fileUuid: string,
  mediaId: string,
): Promise<boolean> {
  const row = await prisma.gedcomMedia.findFirst({
    where: { id: mediaId, fileUuid },
    select: MEDIA_LIVING_LINK_SELECT,
  });
  if (!row) return false;
  return isMediaLinkedOnlyToLivingPeople(row);
}

export async function gateAllLivingLinkedMediaAccess(
  prisma: PrismaClient,
  fileUuid: string,
  mediaId: string,
  returnPath: string,
): Promise<NextResponse | null> {
  const allLiving = await isGedcomMediaLinkedOnlyToLivingPeople(prisma, fileUuid, mediaId);
  if (!allLiving) return null;
  const { resolvePublicViewer } = await import("@/lib/auth/public-viewer-context");
  const viewer = await resolvePublicViewer();
  if (isAuthenticatedViewer(viewer)) return null;
  return authRequiredResponse(returnPath);
}

/** @deprecated Use gateAllLivingLinkedMediaAccess */
export const gateExclusiveLivingMediaAccess = gateAllLivingLinkedMediaAccess;

export async function isCuratedAlbumLinkedOnlyToLivingPeople(
  prisma: PrismaClient,
  fileUuid: string,
  albumId: string,
): Promise<boolean> {
  const joins = await prisma.albumGedcomMedia.findMany({
    where: { albumId, gedcomMedia: { fileUuid } },
    select: { gedcomMediaId: true },
  });
  const mediaIds = joins.map((join) => join.gedcomMediaId);
  if (mediaIds.length === 0) return false;

  const rows = await prisma.gedcomMedia.findMany({
    where: { id: { in: mediaIds }, fileUuid },
    select: MEDIA_LIVING_LINK_SELECT,
  });

  const combined = new Map<string, boolean>();
  for (const row of rows) {
    for (const [id, isLiving] of collectLinkedPeople(row)) {
      combined.set(id, isLiving);
    }
  }
  return areAllLinkedPeopleLiving(combined);
}

export async function batchCuratedAlbumIdsLinkedOnlyToLivingPeople(
  prisma: PrismaClient,
  fileUuid: string,
  albumIds: string[],
): Promise<Set<string>> {
  const gated = new Set<string>();
  await Promise.all(
    albumIds.map(async (albumId) => {
      const allLiving = await isCuratedAlbumLinkedOnlyToLivingPeople(prisma, fileUuid, albumId);
      if (allLiving) gated.add(albumId);
    }),
  );
  return gated;
}

/** @deprecated Use batchCuratedAlbumIdsLinkedOnlyToLivingPeople */
export const batchCuratedAlbumIdsAttachedToLivingPeople = batchCuratedAlbumIdsLinkedOnlyToLivingPeople;

export function buildMediaLoginPath(mediaId: string, returnQuery?: string): string {
  const path =
    returnQuery?.trim()
      ? `/media/${encodeURIComponent(mediaId)}?${returnQuery.trim()}`
      : `/media/${encodeURIComponent(mediaId)}`;
  return buildLoginWallPath(path);
}

export function canViewLivingIndividualGeneratedAlbum(viewer: PublicViewer, isLiving: boolean): boolean {
  return canViewFullIndividual(viewer, isLiving);
}
