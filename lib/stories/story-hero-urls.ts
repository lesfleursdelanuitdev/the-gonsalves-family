import type { StoryCoverMediaKind } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";
import { resolveGedcomMediaFileRef } from "@/lib/images";

export type StoryHeroUrls = { coverSrc: string | null; profileSrc: string | null };

async function resolveCoverKind(mediaId: string | null | undefined, kind: StoryCoverMediaKind | null | undefined): Promise<string | null> {
  if (!mediaId?.trim() || !kind) return null;
  const id = mediaId.trim();
  if (kind === "gedcom_media") {
    const row = await prisma.gedcomMedia.findFirst({ where: { id }, select: { fileRef: true } });
    const ref = row?.fileRef?.trim();
    return ref ? resolveGedcomMediaFileRef(ref) || ref : null;
  }
  if (kind === "site_media") {
    const row = await prisma.siteMedia.findFirst({ where: { id }, select: { fileRef: true, storageKey: true } });
    const ref = row?.fileRef?.trim() || row?.storageKey?.trim();
    return ref ? resolveGedcomMediaFileRef(ref) || ref : null;
  }
  if (kind === "user_media") {
    const row = await prisma.userMedia.findFirst({ where: { id }, select: { fileRef: true, storageKey: true } });
    const ref = row?.fileRef?.trim() || row?.storageKey?.trim();
    return ref ? resolveGedcomMediaFileRef(ref) || ref : null;
  }
  return null;
}

export async function resolveStoryHeroUrls(params: {
  coverMediaId: string | null;
  coverMediaKind: StoryCoverMediaKind | null;
  profileMediaId: string | null;
  profileMediaKind: StoryCoverMediaKind | null;
}): Promise<StoryHeroUrls> {
  const [coverSrc, profileSrc] = await Promise.all([
    resolveCoverKind(params.coverMediaId, params.coverMediaKind),
    resolveCoverKind(params.profileMediaId, params.profileMediaKind),
  ]);
  return { coverSrc, profileSrc: profileSrc ?? coverSrc };
}
