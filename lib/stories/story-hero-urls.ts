import type { StoryCoverMediaKind } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";
import { resolveGedcomMediaFileRef } from "@/lib/images";

export const ARTICLE_DEFAULT_COVER_URL = "/images/articleCover.png";

export type StoryHeroUrls = { coverSrc: string | null; profileSrc: string | null };

/** Cover image for articles: explicit cover, then profile, then the shared default. */
export function articleCoverSrc(coverSrc: string | null, profileSrc: string | null): string {
  return coverSrc ?? profileSrc ?? ARTICLE_DEFAULT_COVER_URL;
}

function refToUrl(ref: string | null | undefined): string | null {
  const r = ref?.trim();
  return r ? resolveGedcomMediaFileRef(r) || r : null;
}

async function resolveGedcomMedia(id: string): Promise<string | null> {
  const row = await prisma.gedcomMedia.findFirst({ where: { id }, select: { fileRef: true } });
  return refToUrl(row?.fileRef);
}

async function resolveSiteMedia(id: string): Promise<string | null> {
  const row = await prisma.siteMedia.findFirst({ where: { id }, select: { fileRef: true, storageKey: true } });
  return refToUrl(row?.fileRef ?? row?.storageKey);
}

async function resolveUserMedia(id: string): Promise<string | null> {
  const row = await prisma.userMedia.findFirst({ where: { id }, select: { fileRef: true, storageKey: true } });
  return refToUrl(row?.fileRef ?? row?.storageKey);
}

// Uses `kind` as the primary lookup but falls through to the other two tables when the
// recorded kind doesn't match the actual row location (can happen when the admin saves
// a cover/profile with a mismatched kind).
async function resolveCoverKind(
  mediaId: string | null | undefined,
  kind: StoryCoverMediaKind | null | undefined,
): Promise<string | null> {
  if (!mediaId?.trim()) return null;
  const id = mediaId.trim();

  const order: Array<() => Promise<string | null>> =
    kind === "gedcom_media"
      ? [() => resolveGedcomMedia(id), () => resolveSiteMedia(id), () => resolveUserMedia(id)]
      : kind === "site_media"
        ? [() => resolveSiteMedia(id), () => resolveGedcomMedia(id), () => resolveUserMedia(id)]
        : [() => resolveUserMedia(id), () => resolveGedcomMedia(id), () => resolveSiteMedia(id)];

  for (const fn of order) {
    const url = await fn();
    if (url) return url;
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
