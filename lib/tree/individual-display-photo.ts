import { Prisma } from "@ligneous/prisma";
import type { PrismaClient } from "@ligneous/prisma";
import { resolveGedcomMediaFileRef } from "../images";

export function isRasterGedcomMediaForm(form: string | null | undefined): boolean {
  const f = (form ?? "").trim().toLowerCase();
  if (!f) return true;
  return ["jpeg", "jpg", "png", "gif", "webp", "bmp", "tif", "tiff"].includes(f);
}

function toPublicUrl(fileRef: string | null | undefined, form: string | null | undefined): string | null {
  const ref = fileRef?.trim();
  if (!ref || !isRasterGedcomMediaForm(form)) return null;
  const url = resolveGedcomMediaFileRef(ref).trim();
  return url || null;
}

/** Chosen OBJE for cards / overlay header: profile media if raster, else one stable linked raster image. */
export type IndividualDisplayPhotoMedia = {
  id: string;
  title: string | null;
  fileRef: string;
  form: string | null;
};

export function individualDisplayPhotoMediaToPublicUrl(
  m: IndividualDisplayPhotoMedia | undefined | null
): string | null {
  if (!m) return null;
  return toPublicUrl(m.fileRef, m.form);
}

/**
 * Batch-resolve display photo per individual (same rules everywhere: explicit profile when raster,
 * else deterministic pick among linked OBJEs via `ORDER BY md5(media_id || individual_id)`).
 */
export async function batchIndividualDisplayPhotoMedia(
  prisma: PrismaClient,
  fileUuid: string,
  individualIds: readonly string[]
): Promise<Map<string, IndividualDisplayPhotoMedia>> {
  const out = new Map<string, IndividualDisplayPhotoMedia>();
  const ids = [...new Set(individualIds)].filter(Boolean);
  if (ids.length === 0) return out;

  const profiles = await prisma.gedcomIndividualProfileMedia.findMany({
    where: { fileUuid, individualId: { in: ids } },
    select: {
      individualId: true,
      media: { select: { id: true, title: true, fileRef: true, form: true } },
    },
  });

  const needsFallback = new Set(ids);
  for (const row of profiles) {
    const ref = row.media?.fileRef?.trim();
    if (!ref || !row.media?.id || !isRasterGedcomMediaForm(row.media.form)) continue;
    out.set(row.individualId, {
      id: row.media.id,
      title: row.media.title ?? null,
      fileRef: ref,
      form: row.media.form,
    });
    needsFallback.delete(row.individualId);
  }

  const fb = [...needsFallback];
  if (fb.length === 0) return out;

  const rawRows = await prisma.$queryRaw<
    Array<{ individual_id: string; id: string; title: string | null; file_ref: string | null; form: string | null }>
  >(Prisma.sql`
    SELECT DISTINCT ON (j.individual_id)
      j.individual_id,
      m.id,
      m.title,
      m.file_ref,
      m.form
    FROM gedcom_individual_media_v2 j
    INNER JOIN gedcom_media_v2 m ON m.id = j.media_id AND m.file_uuid = j.file_uuid
    WHERE j.file_uuid = CAST(${fileUuid} AS uuid)
      AND j.individual_id IN (${Prisma.join(fb)})
      AND (
        LOWER(TRIM(COALESCE(m.form, ''))) IN ('jpeg','jpg','png','gif','webp','bmp','tif','tiff')
        OR TRIM(COALESCE(m.form, '')) = ''
      )
    ORDER BY j.individual_id, md5(m.id::text || j.individual_id::text)
  `);

  for (const r of rawRows) {
    if (out.has(r.individual_id)) continue;
    const ref = r.file_ref?.trim();
    if (!ref) continue;
    out.set(r.individual_id, {
      id: r.id,
      title: r.title,
      fileRef: ref,
      form: r.form,
    });
  }

  return out;
}
