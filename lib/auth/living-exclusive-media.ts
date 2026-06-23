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
  id: true,
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

/** True when the linked-people set is non-empty and includes at least one living person. */
export function hasAnyLivingLinkedPeople(people: Map<string, boolean>): boolean {
  if (people.size === 0) return false;
  return [...people.values()].some((isLiving) => isLiving);
}

export function isMediaLinkedToAnyLivingPeople(input: MediaLivingLinkInput): boolean {
  return hasAnyLivingLinkedPeople(collectLinkedPeople(input));
}

export function hasAnyLivingFamilyPartners(family: FamilyPartners): boolean {
  return hasAnyLivingLinkedPeople(collectFamilyPartners(family));
}

export function canViewLivingFamilyGeneratedAlbum(viewer: PublicViewer, family: FamilyPartners): boolean {
  if (!hasAnyLivingFamilyPartners(family)) return true;
  return isAuthenticatedViewer(viewer);
}

/** @deprecated Use hasAnyLivingLinkedPeople — kept for incremental migration. */
export function areAllLinkedPeopleLiving(people: Map<string, boolean>): boolean {
  if (people.size === 0) return false;
  return [...people.values()].every((isLiving) => isLiving);
}

/** @deprecated Use isMediaLinkedToAnyLivingPeople */
export function isMediaLinkedOnlyToLivingPeople(input: MediaLivingLinkInput): boolean {
  return areAllLinkedPeopleLiving(collectLinkedPeople(input));
}

/** @deprecated Use hasAnyLivingFamilyPartners */
export function isFamilyAllLivingPartners(family: FamilyPartners): boolean {
  return areAllLinkedPeopleLiving(collectFamilyPartners(family));
}

export function shouldGateLivingLinkedEntity(viewer: PublicViewer, hasLivingLinkedPeople: boolean): boolean {
  return hasLivingLinkedPeople && !isAuthenticatedViewer(viewer);
}

/** @deprecated Use shouldGateLivingLinkedEntity */
export const shouldGateAllLivingLinkedEntity = shouldGateLivingLinkedEntity;

export async function isGedcomMediaLinkedToAnyLivingPeople(
  prisma: PrismaClient,
  fileUuid: string,
  mediaId: string,
): Promise<boolean> {
  const row = await prisma.gedcomMedia.findFirst({
    where: { id: mediaId, fileUuid },
    select: MEDIA_LIVING_LINK_SELECT,
  });
  if (!row) return false;
  return isMediaLinkedToAnyLivingPeople(row);
}

/** @deprecated Use isGedcomMediaLinkedToAnyLivingPeople */
export const isGedcomMediaLinkedOnlyToLivingPeople = isGedcomMediaLinkedToAnyLivingPeople;

export async function gateLivingLinkedMediaAccess(
  prisma: PrismaClient,
  fileUuid: string,
  mediaId: string,
  returnPath: string,
): Promise<NextResponse | null> {
  const hasLiving = await isGedcomMediaLinkedToAnyLivingPeople(prisma, fileUuid, mediaId);
  if (!hasLiving) return null;
  const { resolvePublicViewer } = await import("@/lib/auth/public-viewer-context");
  const viewer = await resolvePublicViewer();
  if (isAuthenticatedViewer(viewer)) return null;
  return authRequiredResponse(returnPath);
}

/** @deprecated Use gateLivingLinkedMediaAccess */
export const gateAllLivingLinkedMediaAccess = gateLivingLinkedMediaAccess;

/** @deprecated Use gateLivingLinkedMediaAccess */
export const gateExclusiveLivingMediaAccess = gateLivingLinkedMediaAccess;

export async function isCuratedAlbumLinkedToAnyLivingPeople(
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
  return hasAnyLivingLinkedPeople(combined);
}

/** @deprecated Use isCuratedAlbumLinkedToAnyLivingPeople */
export const isCuratedAlbumLinkedOnlyToLivingPeople = isCuratedAlbumLinkedToAnyLivingPeople;

export async function batchCuratedAlbumIdsWithLivingLinkedPeople(
  prisma: PrismaClient,
  fileUuid: string,
  albumIds: string[],
): Promise<Set<string>> {
  const gated = new Set<string>();
  await Promise.all(
    albumIds.map(async (albumId) => {
      const hasLiving = await isCuratedAlbumLinkedToAnyLivingPeople(prisma, fileUuid, albumId);
      if (hasLiving) gated.add(albumId);
    }),
  );
  return gated;
}

/** @deprecated Use batchCuratedAlbumIdsWithLivingLinkedPeople */
export const batchCuratedAlbumIdsLinkedOnlyToLivingPeople = batchCuratedAlbumIdsWithLivingLinkedPeople;

/** @deprecated Use batchCuratedAlbumIdsWithLivingLinkedPeople */
export const batchCuratedAlbumIdsAttachedToLivingPeople = batchCuratedAlbumIdsWithLivingLinkedPeople;

export function buildMediaLoginPath(mediaId: string, returnQuery?: string): string {
  const path =
    returnQuery?.trim()
      ? `/media/${encodeURIComponent(mediaId)}?${returnQuery.trim()}`
      : `/media/${encodeURIComponent(mediaId)}`;
  return buildLoginWallPath(path);
}

export async function loadMediaLivingLinksById(
  prisma: PrismaClient,
  fileUuid: string,
  mediaIds: string[],
): Promise<Map<string, MediaLivingLinkInput>> {
  if (mediaIds.length === 0) return new Map();
  const rows = await prisma.gedcomMedia.findMany({
    where: { id: { in: mediaIds }, fileUuid },
    select: MEDIA_LIVING_LINK_SELECT,
  });
  return new Map(rows.map((row) => [row.id, row]));
}

export function canViewLivingIndividualGeneratedAlbum(viewer: PublicViewer, isLiving: boolean): boolean {
  return canViewFullIndividual(viewer, isLiving);
}
