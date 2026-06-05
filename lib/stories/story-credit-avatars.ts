import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
} from "@/lib/tree/individual-display-photo";
import type { PublicStoryAuthorCredit } from "@/lib/stories/story-public-meta";

/**
 * Attach `avatarUrl` to credits linked to a family member (`personId`).
 *
 * Uses the same display-photo rules as the rest of the site
 * (`batchIndividualDisplayPhotoMedia`: explicit profile media when raster, else a
 * deterministic linked OBJE). Credits without a `personId`, or whose person has no
 * resolvable photo, are returned unchanged so the byline strip renders its monogram
 * fallback. Never throws on a missing tree / photo — it just leaves `avatarUrl` unset.
 */
export async function resolveCreditAvatars(
  credits: PublicStoryAuthorCredit[],
): Promise<PublicStoryAuthorCredit[]> {
  const personIds = credits.map((c) => c.personId).filter((id): id is string => Boolean(id));
  if (personIds.length === 0) return credits;

  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return credits;

  const photoMap = await batchIndividualDisplayPhotoMedia(prisma, fileUuid, personIds);
  if (photoMap.size === 0) return credits;

  return credits.map((c) => {
    if (!c.personId) return c;
    const url = individualDisplayPhotoMediaToPublicUrl(photoMap.get(c.personId));
    return url ? { ...c, avatarUrl: url } : c;
  });
}
