import { buildEventMediaTitle, familyPairLabel, individualLabel } from "@ligneous/album-generated-queries";
import { gedcomNameToDisplayName } from "@ligneous/album-view";
import { resolveEventPrimaryParticipants } from "@ligneous/gedcom-events";
import { Prisma } from "@ligneous/prisma";
import type { PrismaClient } from "@ligneous/prisma";
import {
  batchCuratedAlbumIdsWithLivingLinkedPeople,
  generatedAlbumPlaceholderCover,
  hasAnyLivingEventParticipants,
  hasAnyLivingFamilyPartners,
  resolveGeneratedMediaUnionScrapbookListCover,
  LIVING_MEDIA_PLACEHOLDER_COVER,
} from "@/lib/auth/living-exclusive-media";
import type { PublicViewer } from "@/lib/auth/public-viewer";
import { isAuthenticatedViewer } from "@/lib/auth/public-viewer";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
  isRasterGedcomMediaForm,
} from "@/lib/tree/individual-display-photo";
import { sourceToAlbumPath } from "@/lib/album/public-album-links";
import type { CuratedAlbum, GeneratedAlbum, PublicAlbumsPageData } from "@/lib/album/public-albums-page-types";

const GENERATED_PREVIEW_LIMIT = 3;
const CURATED_LIST_LIMIT = 12;

const FALLBACK_THUMB = "/images/oldMapBackground.png";

function placeRowTitle(row: {
  original: string;
  name: string | null;
  county: string | null;
  state: string | null;
  country: string | null;
}): string {
  const primary = (row.name ?? "").trim() || row.original.trim();
  if (!primary) return "Place";
  const tail = [row.state, row.country]
    .map((s) => (s ?? "").trim())
    .filter(Boolean);
  return tail.length ? `${primary} · ${tail.join(", ")}` : primary;
}

function dateRowTitle(row: {
  original: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
}): string {
  const o = (row.original ?? "").trim();
  if (o) return o;
  if (row.year != null) {
    if (row.month && row.day) {
      return `${row.year}-${String(row.month).padStart(2, "0")}-${String(row.day).padStart(2, "0")}`;
    }
    if (row.month) return `${row.year}-${String(row.month).padStart(2, "0")}`;
    return String(row.year);
  }
  return "Date";
}

function rasterPublicUrl(fileRef: string | null | undefined, form: string | null | undefined): string | null {
  const ref = fileRef?.trim();
  if (!ref || !isRasterGedcomMediaForm(form)) return null;
  const url = resolveGedcomMediaFileRef(ref).trim();
  return url || null;
}

const MEDIA_SELECT_COVER = { id: true, fileRef: true, form: true } as const;

export async function loadPublicAlbumsPageData(
  prisma: PrismaClient,
  fileUuid: string,
  viewer: PublicViewer = { kind: "anonymous" },
): Promise<PublicAlbumsPageData> {
  const [curatedAlbums, generatedIndividualAlbums, generatedFamilyAlbums, generatedEventAlbums, generatedPlaceAlbums, generatedDateAlbums, generatedTagAlbums] =
    await Promise.all([
      loadCuratedAlbums(prisma, fileUuid, viewer),
      loadTopGeneratedIndividuals(prisma, fileUuid, viewer),
      loadTopGeneratedFamilies(prisma, fileUuid, viewer),
      loadTopGeneratedEvents(prisma, fileUuid, viewer),
      loadTopGeneratedPlaces(prisma, fileUuid, viewer),
      loadTopGeneratedDates(prisma, fileUuid, viewer),
      loadTopGeneratedTags(prisma, fileUuid, viewer),
    ]);

  return {
    curatedAlbums,
    generatedIndividualAlbums,
    generatedFamilyAlbums,
    generatedEventAlbums,
    generatedPlaceAlbums,
    generatedDateAlbums,
    generatedTagAlbums,
  };
}

async function loadCuratedAlbums(
  prisma: PrismaClient,
  fileUuid: string,
  viewer: PublicViewer,
): Promise<CuratedAlbum[]> {
  const albums = await prisma.album.findMany({
    where: {
      isPublic: true,
      albumGedcomMedia: {
        some: { gedcomMedia: { fileUuid } },
        none: { gedcomMedia: { fileUuid: { not: fileUuid } } },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: CURATED_LIST_LIMIT,
    select: {
      id: true,
      name: true,
      description: true,
      coverMediaId: true,
      albumGedcomMedia: {
        where: { gedcomMedia: { fileUuid } },
        orderBy: [{ sortOrder: "asc" }, { addedAt: "asc" }],
        take: 1,
        select: { gedcomMedia: { select: MEDIA_SELECT_COVER } },
      },
    },
  });

  const out: CuratedAlbum[] = [];
  const livingAttachedAlbumIds = isAuthenticatedViewer(viewer)
    ? new Set<string>()
    : await batchCuratedAlbumIdsWithLivingLinkedPeople(
        prisma,
        fileUuid,
        albums.map((album) => album.id),
      );
  const coverIds = [
    ...new Set(
      albums.map((a) => a.coverMediaId).filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const coverById = new Map<string, { fileRef: string | null; form: string | null }>();
  if (coverIds.length > 0) {
    const coverRows = await prisma.gedcomMedia.findMany({
      where: { id: { in: coverIds }, fileUuid },
      select: MEDIA_SELECT_COVER,
    });
    for (const c of coverRows) {
      coverById.set(c.id, { fileRef: c.fileRef, form: c.form });
    }
  }

  for (const a of albums) {
    let coverSrc = FALLBACK_THUMB;
    if (a.coverMediaId) {
      const cm = coverById.get(a.coverMediaId);
      const u = rasterPublicUrl(cm?.fileRef ?? null, cm?.form ?? null);
      if (u) coverSrc = u;
    }
    if (coverSrc === FALLBACK_THUMB) {
      const first = a.albumGedcomMedia[0]?.gedcomMedia;
      const u = rasterPublicUrl(first?.fileRef ?? null, first?.form ?? null);
      if (u) coverSrc = u;
    }
    if (livingAttachedAlbumIds.has(a.id)) {
      coverSrc = LIVING_MEDIA_PLACEHOLDER_COVER;
    }
    out.push({
      id: a.id,
      title: a.name,
      description: (a.description ?? "").trim() || "Curated family album.",
      coverSrc,
    });
  }
  return out;
}

async function loadTopGeneratedIndividuals(
  prisma: PrismaClient,
  fileUuid: string,
  viewer: PublicViewer,
): Promise<GeneratedAlbum[]> {
  const rows = await prisma.$queryRaw<Array<{ individual_id: string; media_count: number }>>(
    Prisma.sql`
      WITH rows AS (
        SELECT individual_id, media_id
        FROM gedcom_individual_media_v2
        WHERE file_uuid = CAST(${fileUuid} AS uuid)
        UNION
        SELECT gip.individual_id, gip.media_id
        FROM gedcom_individual_profile_media_v2 gip
        INNER JOIN gedcom_media_v2 gm ON gm.id = gip.media_id AND gm.file_uuid = CAST(${fileUuid} AS uuid)
        WHERE gip.file_uuid = CAST(${fileUuid} AS uuid)
      ),
      agg AS (
        SELECT individual_id, COUNT(DISTINCT media_id)::int AS media_count
        FROM rows
        GROUP BY individual_id
      )
      SELECT individual_id, media_count
      FROM agg
      WHERE media_count > 0
      ORDER BY media_count DESC, individual_id
      LIMIT ${GENERATED_PREVIEW_LIMIT}
    `,
  );

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.individual_id);
  const [individuals, photoMap] = await Promise.all([
    prisma.gedcomIndividual.findMany({
      where: { id: { in: ids }, fileUuid },
      select: { id: true, fullName: true, xref: true, isLiving: true },
    }),
    batchIndividualDisplayPhotoMedia(prisma, fileUuid, ids),
  ]);
  const nameById = new Map(individuals.map((i) => [i.id, i]));

  return rows.flatMap((r) => {
    const ind = nameById.get(r.individual_id);
    if (!ind) return [];
    const title = gedcomNameToDisplayName(ind.fullName, ind.xref);
    const thumb =
      individualDisplayPhotoMediaToPublicUrl(photoMap.get(r.individual_id)) ?? FALLBACK_THUMB;
    return [
      {
        id: r.individual_id,
        title,
        photoCount: r.media_count,
        thumbSrc: generatedAlbumPlaceholderCover(viewer, ind.isLiving, thumb),
        href: sourceToAlbumPath({ type: "individual", individualId: r.individual_id }),
      },
    ];
  });
}

async function loadTopGeneratedEvents(
  prisma: PrismaClient,
  fileUuid: string,
  viewer: PublicViewer,
): Promise<GeneratedAlbum[]> {
  const rows = await prisma.$queryRaw<Array<{ event_id: string; media_count: number }>>(
    Prisma.sql`
      WITH rows AS (
        SELECT event_id, media_id
        FROM gedcom_event_media_v2
        WHERE file_uuid = CAST(${fileUuid} AS uuid)
        UNION
        SELECT gep.event_id, gep.media_id
        FROM gedcom_event_profile_media_v2 gep
        INNER JOIN gedcom_media_v2 gm ON gm.id = gep.media_id AND gm.file_uuid = CAST(${fileUuid} AS uuid)
        WHERE gep.file_uuid = CAST(${fileUuid} AS uuid)
      ),
      agg AS (
        SELECT event_id, COUNT(DISTINCT media_id)::int AS media_count
        FROM rows
        GROUP BY event_id
      )
      SELECT event_id, media_count
      FROM agg
      WHERE media_count > 0
      ORDER BY media_count DESC, event_id
      LIMIT ${GENERATED_PREVIEW_LIMIT}
    `,
  );

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.event_id);
  const events = await prisma.gedcomEvent.findMany({
    where: { id: { in: ids }, fileUuid },
    select: {
      id: true,
      eventType: true,
      customType: true,
      familyEvents: {
        select: {
          family: {
            select: {
              id: true,
              husband: { select: { id: true, fullName: true, xref: true, isLiving: true } },
              wife: { select: { id: true, fullName: true, xref: true, isLiving: true } },
            },
          },
        },
      },
      individualEvents: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          participantKind: true,
          role: true,
          sortOrder: true,
          individual: { select: { id: true, fullName: true, xref: true, isLiving: true } },
        },
      },
    },
  });

  const thumbByEvent = await batchEventRasterThumbUrls(prisma, fileUuid, ids);
  const titleById = new Map(
    events.map((ev) => {
      const resolved = resolveEventPrimaryParticipants({
        individualEvents: ev.individualEvents,
        familyEvents: ev.familyEvents,
      });
      const fam = ev.familyEvents?.[0]?.family;
      const familyPair =
        resolved.source === "family-partners" && fam
          ? familyPairLabel({
              husbandFullName: fam.husband?.fullName,
              wifeFullName: fam.wife?.fullName,
              husbandXref: fam.husband?.xref ?? null,
              wifeXref: fam.wife?.xref ?? null,
            })
          : null;
      const primary = resolved.individuals[0];
      const individualName = primary
        ? individualLabel(primary.fullName ?? null, primary.xref ?? null)
        : null;
      const title = buildEventMediaTitle({
        eventType: ev.eventType ?? "EVEN",
        customType: ev.customType,
        familyPair,
        individualName,
      });
      return [ev.id, title] as const;
    }),
  );

  const eventById = new Map(events.map((ev) => [ev.id, ev]));

  return rows.map((r) => {
    const ev = eventById.get(r.event_id);
    const thumb = thumbByEvent.get(r.event_id) ?? FALLBACK_THUMB;
    const hasLiving = ev ? hasAnyLivingEventParticipants(ev) : false;
    return {
      id: r.event_id,
      title: titleById.get(r.event_id) ?? "Event media",
      photoCount: r.media_count,
      thumbSrc: generatedAlbumPlaceholderCover(viewer, hasLiving, thumb),
      href: sourceToAlbumPath({ type: "event", eventId: r.event_id }),
    };
  });
}

async function batchEventRasterThumbUrls(
  prisma: PrismaClient,
  fileUuid: string,
  eventIds: readonly string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (eventIds.length === 0) return out;

  const profiles = await prisma.gedcomEventProfileMedia.findMany({
    where: { fileUuid, eventId: { in: [...eventIds] } },
    select: { eventId: true, media: { select: { fileRef: true, form: true } } },
  });
  for (const p of profiles) {
    const u = rasterPublicUrl(p.media?.fileRef ?? null, p.media?.form ?? null);
    if (u) out.set(p.eventId, u);
  }

  const need = eventIds.filter((id) => !out.has(id));
  if (need.length === 0) return out;

  const rawRows = await prisma.$queryRaw<
    Array<{ event_id: string; file_ref: string | null; form: string | null }>
  >(Prisma.sql`
    SELECT DISTINCT ON (j.event_id)
      j.event_id,
      m.file_ref,
      m.form
    FROM gedcom_event_media_v2 j
    INNER JOIN gedcom_media_v2 m ON m.id = j.media_id AND m.file_uuid = j.file_uuid
    WHERE j.file_uuid = CAST(${fileUuid} AS uuid)
      AND j.event_id IN (${Prisma.join(need)})
      AND (
        LOWER(TRIM(COALESCE(m.form, ''))) IN ('jpeg','jpg','png','gif','webp','bmp','tif','tiff')
        OR TRIM(COALESCE(m.form, '')) = ''
      )
    ORDER BY j.event_id, md5(m.id::text || j.event_id::text)
  `);

  for (const r of rawRows) {
    if (out.has(r.event_id)) continue;
    const u = rasterPublicUrl(r.file_ref, r.form);
    if (u) out.set(r.event_id, u);
  }
  return out;
}

async function batchFamilyRasterThumbUrls(
  prisma: PrismaClient,
  fileUuid: string,
  familyIds: readonly string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (familyIds.length === 0) return out;

  const profiles = await prisma.gedcomFamilyProfileMedia.findMany({
    where: { fileUuid, familyId: { in: [...familyIds] } },
    select: { familyId: true, media: { select: { fileRef: true, form: true } } },
  });
  for (const p of profiles) {
    const u = rasterPublicUrl(p.media?.fileRef ?? null, p.media?.form ?? null);
    if (u) out.set(p.familyId, u);
  }

  const need = familyIds.filter((id) => !out.has(id));
  if (need.length === 0) return out;

  const rawRows = await prisma.$queryRaw<
    Array<{ family_id: string; file_ref: string | null; form: string | null }>
  >(Prisma.sql`
    SELECT DISTINCT ON (j.family_id)
      j.family_id,
      m.file_ref,
      m.form
    FROM gedcom_family_media_v2 j
    INNER JOIN gedcom_media_v2 m ON m.id = j.media_id AND m.file_uuid = j.file_uuid
    WHERE j.file_uuid = CAST(${fileUuid} AS uuid)
      AND j.family_id IN (${Prisma.join(need)})
      AND (
        LOWER(TRIM(COALESCE(m.form, ''))) IN ('jpeg','jpg','png','gif','webp','bmp','tif','tiff')
        OR TRIM(COALESCE(m.form, '')) = ''
      )
    ORDER BY j.family_id, md5(m.id::text || j.family_id::text)
  `);

  for (const r of rawRows) {
    if (out.has(r.family_id)) continue;
    const u = rasterPublicUrl(r.file_ref, r.form);
    if (u) out.set(r.family_id, u);
  }
  return out;
}

async function loadTopGeneratedFamilies(
  prisma: PrismaClient,
  fileUuid: string,
  viewer: PublicViewer,
): Promise<GeneratedAlbum[]> {
  const rows = await prisma.$queryRaw<Array<{ family_id: string; media_count: number }>>(
    Prisma.sql`
      WITH rows AS (
        SELECT family_id, media_id
        FROM gedcom_family_media_v2
        WHERE file_uuid = CAST(${fileUuid} AS uuid)
        UNION
        SELECT gfp.family_id, gfp.media_id
        FROM gedcom_family_profile_media_v2 gfp
        INNER JOIN gedcom_media_v2 gm ON gm.id = gfp.media_id AND gm.file_uuid = CAST(${fileUuid} AS uuid)
        WHERE gfp.file_uuid = CAST(${fileUuid} AS uuid)
      ),
      agg AS (
        SELECT family_id, COUNT(DISTINCT media_id)::int AS media_count
        FROM rows
        GROUP BY family_id
      )
      SELECT family_id, media_count
      FROM agg
      WHERE media_count > 0
      ORDER BY media_count DESC, family_id
      LIMIT ${GENERATED_PREVIEW_LIMIT}
    `,
  );

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.family_id);
  const families = await prisma.gedcomFamily.findMany({
    where: { id: { in: ids }, fileUuid },
    select: {
      id: true,
      husband: { select: { id: true, fullName: true, xref: true, isLiving: true } },
      wife: { select: { id: true, fullName: true, xref: true, isLiving: true } },
    },
  });
  const thumbByFamily = await batchFamilyRasterThumbUrls(prisma, fileUuid, ids);
  const familyById = new Map(families.map((f) => [f.id, f]));

  return rows.flatMap((r) => {
    const family = familyById.get(r.family_id);
    if (!family) return [];
    const pair = familyPairLabel({
      husbandFullName: family.husband?.fullName,
      wifeFullName: family.wife?.fullName,
      husbandXref: family.husband?.xref ?? null,
      wifeXref: family.wife?.xref ?? null,
    });
    const thumb = thumbByFamily.get(r.family_id) ?? FALLBACK_THUMB;
    return [
      {
        id: r.family_id,
        title: pair ?? "Family",
        photoCount: r.media_count,
        thumbSrc: generatedAlbumPlaceholderCover(viewer, hasAnyLivingFamilyPartners(family), thumb),
        href: sourceToAlbumPath({ type: "family", familyId: r.family_id }),
      },
    ];
  });
}

async function batchPlaceRasterThumbUrls(
  prisma: PrismaClient,
  fileUuid: string,
  placeIds: readonly string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (placeIds.length === 0) return out;

  const rawRows = await prisma.$queryRaw<
    Array<{ place_id: string; file_ref: string | null; form: string | null }>
  >(Prisma.sql`
    SELECT DISTINCT ON (j.place_id)
      j.place_id,
      m.file_ref,
      m.form
    FROM gedcom_media_places_v2 j
    INNER JOIN gedcom_media_v2 m ON m.id = j.media_id AND m.file_uuid = j.file_uuid
    WHERE j.file_uuid = CAST(${fileUuid} AS uuid)
      AND j.place_id IN (${Prisma.join([...placeIds])})
      AND (
        LOWER(TRIM(COALESCE(m.form, ''))) IN ('jpeg','jpg','png','gif','webp','bmp','tif','tiff')
        OR TRIM(COALESCE(m.form, '')) = ''
      )
    ORDER BY j.place_id, md5(m.id::text || j.place_id::text)
  `);

  for (const r of rawRows) {
    const u = rasterPublicUrl(r.file_ref, r.form);
    if (u) out.set(r.place_id, u);
  }
  return out;
}

async function loadTopGeneratedPlaces(
  prisma: PrismaClient,
  fileUuid: string,
  viewer: PublicViewer,
): Promise<GeneratedAlbum[]> {
  const rows = await prisma.$queryRaw<Array<{ place_id: string; media_count: number }>>(
    Prisma.sql`
      WITH agg AS (
        SELECT place_id, COUNT(DISTINCT media_id)::int AS media_count
        FROM gedcom_media_places_v2
        WHERE file_uuid = CAST(${fileUuid} AS uuid)
        GROUP BY place_id
      )
      SELECT place_id, media_count
      FROM agg
      WHERE media_count > 0
      ORDER BY media_count DESC, place_id
      LIMIT ${GENERATED_PREVIEW_LIMIT}
    `,
  );

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.place_id);
  const [places, thumbByPlace] = await Promise.all([
    prisma.gedcomPlace.findMany({
      where: { id: { in: ids }, fileUuid },
      select: { id: true, original: true, name: true, county: true, state: true, country: true },
    }),
    batchPlaceRasterThumbUrls(prisma, fileUuid, ids),
  ]);
  const titleById = new Map(places.map((p) => [p.id, placeRowTitle(p)] as const));

  return Promise.all(
    rows.map(async (r) => {
      const thumb = thumbByPlace.get(r.place_id) ?? FALLBACK_THUMB;
      const thumbSrc = await resolveGeneratedMediaUnionScrapbookListCover(
        prisma,
        fileUuid,
        viewer,
        { type: "place", placeId: r.place_id },
        thumb,
      );
      return {
        id: r.place_id,
        title: titleById.get(r.place_id) ?? "Place",
        photoCount: r.media_count,
        thumbSrc,
        href: sourceToAlbumPath({ type: "place", placeId: r.place_id }),
      };
    }),
  );
}

async function batchDateRasterThumbUrls(
  prisma: PrismaClient,
  fileUuid: string,
  dateIds: readonly string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (dateIds.length === 0) return out;

  const rawRows = await prisma.$queryRaw<
    Array<{ date_id: string; file_ref: string | null; form: string | null }>
  >(Prisma.sql`
    SELECT DISTINCT ON (j.date_id)
      j.date_id,
      m.file_ref,
      m.form
    FROM gedcom_media_dates_v2 j
    INNER JOIN gedcom_media_v2 m ON m.id = j.media_id AND m.file_uuid = j.file_uuid
    WHERE j.file_uuid = CAST(${fileUuid} AS uuid)
      AND j.date_id IN (${Prisma.join([...dateIds])})
      AND (
        LOWER(TRIM(COALESCE(m.form, ''))) IN ('jpeg','jpg','png','gif','webp','bmp','tif','tiff')
        OR TRIM(COALESCE(m.form, '')) = ''
      )
    ORDER BY j.date_id, md5(m.id::text || j.date_id::text)
  `);

  for (const r of rawRows) {
    const u = rasterPublicUrl(r.file_ref, r.form);
    if (u) out.set(r.date_id, u);
  }
  return out;
}

async function loadTopGeneratedDates(
  prisma: PrismaClient,
  fileUuid: string,
  viewer: PublicViewer,
): Promise<GeneratedAlbum[]> {
  const rows = await prisma.$queryRaw<Array<{ date_id: string; media_count: number }>>(
    Prisma.sql`
      WITH agg AS (
        SELECT date_id, COUNT(DISTINCT media_id)::int AS media_count
        FROM gedcom_media_dates_v2
        WHERE file_uuid = CAST(${fileUuid} AS uuid)
        GROUP BY date_id
      )
      SELECT date_id, media_count
      FROM agg
      WHERE media_count > 0
      ORDER BY media_count DESC, date_id
      LIMIT ${GENERATED_PREVIEW_LIMIT}
    `,
  );

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.date_id);
  const [dates, thumbByDate] = await Promise.all([
    prisma.gedcomDate.findMany({
      where: { id: { in: ids }, fileUuid },
      select: { id: true, original: true, year: true, month: true, day: true },
    }),
    batchDateRasterThumbUrls(prisma, fileUuid, ids),
  ]);
  const titleById = new Map(dates.map((d) => [d.id, dateRowTitle(d)] as const));

  return Promise.all(
    rows.map(async (r) => {
      const thumb = thumbByDate.get(r.date_id) ?? FALLBACK_THUMB;
      const thumbSrc = await resolveGeneratedMediaUnionScrapbookListCover(
        prisma,
        fileUuid,
        viewer,
        { type: "date", dateId: r.date_id },
        thumb,
      );
      return {
        id: r.date_id,
        title: titleById.get(r.date_id) ?? "Date",
        photoCount: r.media_count,
        thumbSrc,
        href: sourceToAlbumPath({ type: "date", dateId: r.date_id }),
      };
    }),
  );
}

async function loadTopGeneratedTags(
  prisma: PrismaClient,
  fileUuid: string,
  viewer: PublicViewer,
): Promise<GeneratedAlbum[]> {
  const rows = await prisma.$queryRaw<Array<{ tag_id: string; media_count: number }>>(
    Prisma.sql`
      WITH rows AS (
        SELECT gmat.tag_id, gmat.gedcom_media_id AS media_id
        FROM gedcom_media_app_tags gmat
        INNER JOIN gedcom_media_v2 gm ON gm.id = gmat.gedcom_media_id AND gm.file_uuid = CAST(${fileUuid} AS uuid)
        UNION
        SELECT tpm.tag_id, tpm.media_id
        FROM tag_profile_media tpm
        INNER JOIN gedcom_media_v2 gm ON gm.id = tpm.media_id AND gm.file_uuid = CAST(${fileUuid} AS uuid)
        WHERE tpm.file_uuid = CAST(${fileUuid} AS uuid)
      ),
      agg AS (
        SELECT tag_id, COUNT(DISTINCT media_id)::int AS media_count
        FROM rows
        GROUP BY tag_id
      )
      SELECT tag_id, media_count
      FROM agg
      WHERE media_count > 0
      ORDER BY media_count DESC, tag_id
      LIMIT ${GENERATED_PREVIEW_LIMIT}
    `,
  );

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.tag_id);
  const [tags, thumbByTag] = await Promise.all([
    prisma.tag.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
    batchTagRasterThumbUrls(prisma, fileUuid, ids),
  ]);
  const nameById = new Map(tags.map((t) => [t.id, t.name]));

  return Promise.all(
    rows.map(async (r) => {
      const thumb = thumbByTag.get(r.tag_id) ?? FALLBACK_THUMB;
      const thumbSrc = await resolveGeneratedMediaUnionScrapbookListCover(
        prisma,
        fileUuid,
        viewer,
        { type: "tag", tagId: r.tag_id },
        thumb,
      );
      return {
        id: r.tag_id,
        title: (nameById.get(r.tag_id) ?? "Tag").trim() || "Tag",
        photoCount: r.media_count,
        thumbSrc,
        href: sourceToAlbumPath({ type: "tag", tagId: r.tag_id }),
      };
    }),
  );
}

async function batchTagRasterThumbUrls(
  prisma: PrismaClient,
  fileUuid: string,
  tagIds: readonly string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (tagIds.length === 0) return out;

  const profiles = await prisma.tagProfileMedia.findMany({
    where: { fileUuid, tagId: { in: [...tagIds] } },
    select: { tagId: true, media: { select: { fileRef: true, form: true } } },
  });
  for (const p of profiles) {
    const u = rasterPublicUrl(p.media?.fileRef ?? null, p.media?.form ?? null);
    if (u) out.set(p.tagId, u);
  }

  const need = tagIds.filter((id) => !out.has(id));
  if (need.length === 0) return out;

  const rawRows = await prisma.$queryRaw<
    Array<{ tag_id: string; file_ref: string | null; form: string | null }>
  >(Prisma.sql`
    SELECT DISTINCT ON (gmat.tag_id)
      gmat.tag_id,
      m.file_ref,
      m.form
    FROM gedcom_media_app_tags gmat
    INNER JOIN gedcom_media_v2 m ON m.id = gmat.gedcom_media_id
    WHERE m.file_uuid = CAST(${fileUuid} AS uuid)
      AND gmat.tag_id IN (${Prisma.join(need)})
      AND (
        LOWER(TRIM(COALESCE(m.form, ''))) IN ('jpeg','jpg','png','gif','webp','bmp','tif','tiff')
        OR TRIM(COALESCE(m.form, '')) = ''
      )
    ORDER BY gmat.tag_id, md5(m.id::text || gmat.tag_id::text)
  `);

  for (const r of rawRows) {
    if (out.has(r.tag_id)) continue;
    const u = rasterPublicUrl(r.file_ref, r.form);
    if (u) out.set(r.tag_id, u);
  }
  return out;
}
