import type { PrismaClient } from "@ligneous/prisma";
import { NextResponse } from "next/server";
import { authRequiredResponse } from "@/lib/auth/auth-required-response";
import { canViewFullIndividual, resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { loadIndividualLivingStatus } from "@/lib/individuals/load-individual-living-status";

export async function gateLivingIndividualAlbumAccess(
  individualId: string,
  returnPath: string,
): Promise<NextResponse | null> {
  const status = await loadIndividualLivingStatus(individualId);
  if (!status?.isLiving) return null;
  const viewer = await resolvePublicViewer();
  if (canViewFullIndividual(viewer, status.isLiving)) return null;
  return authRequiredResponse(returnPath);
}

/**
 * Curated album is "attached" to a living person when every OBJE in the album is
 * linked via gedcomIndividualMedia to the same living individual (exclusive subject).
 */
export async function findCuratedAlbumExclusiveLivingSubjectId(
  prisma: PrismaClient,
  fileUuid: string,
  albumId: string,
): Promise<string | null> {
  const joins = await prisma.albumGedcomMedia.findMany({
    where: { albumId, gedcomMedia: { fileUuid } },
    select: { gedcomMediaId: true },
  });
  const mediaIds = joins.map((j) => j.gedcomMediaId);
  if (mediaIds.length === 0) return null;

  const links = await prisma.gedcomIndividualMedia.findMany({
    where: { fileUuid, mediaId: { in: mediaIds } },
    select: {
      mediaId: true,
      individualId: true,
      individual: { select: { isLiving: true } },
    },
  });

  const mediaToIndividuals = new Map<string, Set<string>>();
  for (const link of links) {
    let set = mediaToIndividuals.get(link.mediaId);
    if (!set) {
      set = new Set();
      mediaToIndividuals.set(link.mediaId, set);
    }
    set.add(link.individualId);
  }

  let subjectId: string | null = null;
  for (const mediaId of mediaIds) {
    const inds = mediaToIndividuals.get(mediaId);
    if (!inds || inds.size !== 1) return null;
    const id = [...inds][0]!;
    if (subjectId === null) subjectId = id;
    else if (subjectId !== id) return null;
  }

  if (!subjectId) return null;
  const living = links.find((l) => l.individualId === subjectId)?.individual.isLiving;
  return living ? subjectId : null;
}

export async function gateCuratedAlbumAttachedToLivingAccess(
  prisma: PrismaClient,
  fileUuid: string,
  albumId: string,
): Promise<NextResponse | null> {
  const subjectId = await findCuratedAlbumExclusiveLivingSubjectId(prisma, fileUuid, albumId);
  if (!subjectId) return null;
  return gateLivingIndividualAlbumAccess(
    subjectId,
    `/media/album/${encodeURIComponent(albumId)}`,
  );
}
