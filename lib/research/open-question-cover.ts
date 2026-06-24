import {
  isMediaLinkedToAnyLivingPeople,
  type MediaLivingLinkInput,
} from "@/lib/auth/living-exclusive-media";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import { isRasterGedcomMediaForm } from "@/lib/tree/individual-display-photo";

export type OpenQuestionCoverMedia = MediaLivingLinkInput & {
  id: string;
  fileRef: string | null;
  form: string | null;
};

export function openQuestionMediaRasterUrl(media: Pick<OpenQuestionCoverMedia, "fileRef" | "form">): string | null {
  const ref = media.fileRef?.trim();
  if (!ref || !isRasterGedcomMediaForm(media.form)) return null;
  const url = resolveGedcomMediaFileRef(ref).trim();
  return url || null;
}

/** Public cover only when media is a raster image and not linked to any living person. */
export function isPublicSafeOpenQuestionCoverMedia(media: OpenQuestionCoverMedia): boolean {
  if (!openQuestionMediaRasterUrl(media)) return false;
  return !isMediaLinkedToAnyLivingPeople(media);
}

function stableIndex(seed: string, length: number): number {
  if (length <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

/** Pick a stable pseudo-random eligible linked media cover for list/detail cards. */
export function pickOpenQuestionCoverSrc(questionId: string, mediaRows: OpenQuestionCoverMedia[]): string | null {
  const eligible = mediaRows.filter(isPublicSafeOpenQuestionCoverMedia);
  if (eligible.length === 0) return null;
  const picked = eligible[stableIndex(questionId, eligible.length)]!;
  return openQuestionMediaRasterUrl(picked);
}
