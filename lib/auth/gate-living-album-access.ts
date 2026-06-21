import type { PrismaClient } from "@ligneous/prisma";
import { NextResponse } from "next/server";
import { authRequiredResponse } from "@/lib/auth/auth-required-response";
import {
  isCuratedAlbumLinkedOnlyToLivingPeople,
  isFamilyAllLivingPartners,
} from "@/lib/auth/living-exclusive-media";
import { canViewFullIndividual, isAuthenticatedViewer, resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { loadIndividualLivingStatus } from "@/lib/individuals/load-individual-living-status";

const FAMILY_PARTNERS_SELECT = {
  husband: { select: { id: true, isLiving: true } },
  wife: { select: { id: true, isLiving: true } },
} as const;

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

export async function gateGeneratedFamilyAlbumAccess(
  prisma: PrismaClient,
  fileUuid: string,
  familyId: string,
  returnPath: string,
): Promise<NextResponse | null> {
  const family = await prisma.gedcomFamily.findFirst({
    where: { id: familyId, fileUuid },
    select: FAMILY_PARTNERS_SELECT,
  });
  if (!family || !isFamilyAllLivingPartners(family)) return null;

  const viewer = await resolvePublicViewer();
  if (isAuthenticatedViewer(viewer)) return null;

  return authRequiredResponse(returnPath);
}

/** Curated album gated when every person linked across all album media is living (§6.6). */
export async function gateCuratedAlbumAttachedToLivingAccess(
  prisma: PrismaClient,
  fileUuid: string,
  albumId: string,
): Promise<NextResponse | null> {
  const allLiving = await isCuratedAlbumLinkedOnlyToLivingPeople(prisma, fileUuid, albumId);
  if (!allLiving) return null;

  const viewer = await resolvePublicViewer();
  if (isAuthenticatedViewer(viewer)) return null;

  return authRequiredResponse(`/media/album/${encodeURIComponent(albumId)}`);
}

/** @deprecated Use gateCuratedAlbumAttachedToLivingAccess — name kept for call sites. */
export const gateCuratedAlbumAllLivingLinkedAccess = gateCuratedAlbumAttachedToLivingAccess;
