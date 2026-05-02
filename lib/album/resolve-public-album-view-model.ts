import type { PrismaClient } from "@ligneous/prisma";
import type {
  AlbumMediaLinkedDate,
  AlbumMediaLinkedIndividual,
  AlbumMediaLinkedPlace,
  AlbumMediaLinkedTag,
  AlbumViewModel,
  AlbumViewSource,
  MediaSummary,
} from "@ligneous/album-view";
import { gedcomNameToDisplayName, inferMediaBucketKind, pickCoverMediaFromSummaries, resolveAlbumCoverMedia } from "@ligneous/album-view";
import { collectMediaIdsForGenerated } from "@ligneous/album-generated-queries";

const MEDIA_SELECT = {
  id: true,
  title: true,
  fileRef: true,
  form: true,
  description: true,
  createdAt: true,
} as const;

function toSummary(m: {
  id: string;
  title: string | null;
  fileRef: string | null;
  form: string | null;
  description?: string | null;
}): MediaSummary {
  return {
    id: m.id,
    title: m.title,
    fileRef: m.fileRef,
    form: m.form,
    description: m.description ?? null,
  };
}

function dedupeById(items: MediaSummary[]): MediaSummary[] {
  const seen = new Set<string>();
  const out: MediaSummary[] = [];
  for (const m of items) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
}

const INDIVIDUAL_LINK_SELECT = { id: true, fullName: true, xref: true } as const;

function linkedPersonFromRow(row: { id: string; fullName: string | null; xref: string }): AlbumMediaLinkedIndividual {
  const raw = (row.fullName ?? "").trim();
  const gedcomName = raw || row.xref;
  const displayName = gedcomNameToDisplayName(row.fullName, row.xref);
  return { id: row.id, xref: row.xref, gedcomName, displayName };
}

function sortPeopleByName(people: Iterable<AlbumMediaLinkedIndividual>): AlbumMediaLinkedIndividual[] {
  return [...people].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
  );
}

/**
 * For each media id, distinct individuals: INDI↔OBJE, FAM↔OBJE (spouses),
 * and events linked to OBJE (principals + family event spouses).
 */
async function collectLinkedIndividualsPerMediaId(
  prisma: PrismaClient,
  fileUuid: string,
  mediaIds: string[],
): Promise<Map<string, AlbumMediaLinkedIndividual[]>> {
  if (mediaIds.length === 0) return new Map();

  const buckets = new Map<string, Map<string, AlbumMediaLinkedIndividual>>();

  const add = (
    mediaId: string,
    row: { id: string; fullName: string | null; xref: string } | null | undefined,
  ) => {
    if (!row?.id) return;
    let inner = buckets.get(mediaId);
    if (!inner) {
      inner = new Map();
      buckets.set(mediaId, inner);
    }
    inner.set(row.id, linkedPersonFromRow(row));
  };

  const indMedia = await prisma.gedcomIndividualMedia.findMany({
    where: { fileUuid, mediaId: { in: mediaIds } },
    select: { mediaId: true, individual: { select: INDIVIDUAL_LINK_SELECT } },
  });
  for (const r of indMedia) add(r.mediaId, r.individual);

  const famMedia = await prisma.gedcomFamilyMedia.findMany({
    where: { fileUuid, mediaId: { in: mediaIds } },
    select: {
      mediaId: true,
      family: {
        select: {
          husband: { select: INDIVIDUAL_LINK_SELECT },
          wife: { select: INDIVIDUAL_LINK_SELECT },
        },
      },
    },
  });
  for (const r of famMedia) {
    add(r.mediaId, r.family?.husband);
    add(r.mediaId, r.family?.wife);
  }

  const eventMedia = await prisma.gedcomEventMedia.findMany({
    where: { fileUuid, mediaId: { in: mediaIds } },
    select: {
      mediaId: true,
      event: {
        select: {
          individualEvents: { select: { individual: { select: INDIVIDUAL_LINK_SELECT } } },
          familyEvents: {
            select: {
              family: {
                select: {
                  husband: { select: INDIVIDUAL_LINK_SELECT },
                  wife: { select: INDIVIDUAL_LINK_SELECT },
                },
              },
            },
          },
        },
      },
    },
  });
  for (const r of eventMedia) {
    const ev = r.event;
    if (!ev) continue;
    for (const ie of ev.individualEvents ?? []) add(r.mediaId, ie.individual);
    for (const fe of ev.familyEvents ?? []) {
      add(r.mediaId, fe.family?.husband);
      add(r.mediaId, fe.family?.wife);
    }
  }

  const out = new Map<string, AlbumMediaLinkedIndividual[]>();
  for (const [mid, inner] of buckets) {
    out.set(mid, sortPeopleByName(inner.values()));
  }
  return out;
}

function attachPerMediaLinks(
  media: MediaSummary[],
  perMedia: Map<string, AlbumMediaLinkedIndividual[]>,
): MediaSummary[] {
  return media.map((m) => ({
    ...m,
    linkedIndividuals: perMedia.get(m.id) ?? [],
  }));
}

function attachPerMediaPlacesAndDates(
  media: MediaSummary[],
  perMedia: Map<string, { linkedPlaces: AlbumMediaLinkedPlace[]; linkedDates: AlbumMediaLinkedDate[] }>,
): MediaSummary[] {
  return media.map((m) => {
    const pd = perMedia.get(m.id);
    return {
      ...m,
      linkedPlaces: pd?.linkedPlaces ?? [],
      linkedDates: pd?.linkedDates ?? [],
    };
  });
}

function sortLinkedTagsByName(tags: AlbumMediaLinkedTag[]): AlbumMediaLinkedTag[] {
  return [...tags].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

/**
 * Re-fetch OBJE `description` and app tags from the DB so album payloads match `/api/media-view`
 * (avoids stale or partial summaries; single round-trip for all ids).
 */
async function enrichMediaWithDescriptionAndTags(
  prisma: PrismaClient,
  fileUuid: string,
  media: MediaSummary[],
): Promise<MediaSummary[]> {
  const ids = media.map((m) => m.id);
  if (ids.length === 0) return media;

  const rows = await prisma.gedcomMedia.findMany({
    where: { fileUuid, id: { in: ids } },
    select: {
      id: true,
      description: true,
      appTags: {
        select: {
          tag: { select: { id: true, name: true } },
        },
      },
    },
  });

  const byId = new Map<string, { description: string | null; tags: AlbumMediaLinkedTag[] }>();
  for (const r of rows) {
    const tags = sortLinkedTagsByName(
      r.appTags
        .map((x) => x.tag)
        .filter((t): t is { id: string; name: string } => Boolean(t))
        .map((t) => ({ id: t.id, name: t.name })),
    );
    byId.set(r.id, { description: r.description ?? null, tags });
  }

  return media.map((m) => {
    const row = byId.get(m.id);
    if (!row) {
      return { ...m, linkedTags: m.linkedTags ?? [] };
    }
    return {
      ...m,
      description: row.description ?? m.description ?? null,
      linkedTags: row.tags,
    };
  });
}

function unionLinkedIndividualsSorted(
  perMedia: Map<string, AlbumMediaLinkedIndividual[]>,
): AlbumMediaLinkedIndividual[] {
  const byId = new Map<string, AlbumMediaLinkedIndividual>();
  for (const list of perMedia.values()) {
    for (const p of list) byId.set(p.id, p);
  }
  return sortPeopleByName(byId.values());
}

function attachMediaCountsToPeople(
  people: AlbumMediaLinkedIndividual[],
  perMedia: Map<string, AlbumMediaLinkedIndividual[]>,
): AlbumMediaLinkedIndividual[] {
  const counts = new Map<string, number>();
  for (const list of perMedia.values()) {
    for (const p of list) {
      counts.set(p.id, (counts.get(p.id) ?? 0) + 1);
    }
  }
  return people.map((p) => ({
    ...p,
    mediaCount: counts.get(p.id) ?? 0,
  }));
}

function dedupePlaces(places: AlbumMediaLinkedPlace[]): AlbumMediaLinkedPlace[] {
  const map = new Map<string, AlbumMediaLinkedPlace>();
  for (const p of places) map.set(p.id, p);
  return [...map.values()].sort((a, b) => {
    const aKey = [a.name, a.county, a.state, a.country, a.original].map((x) => (x ?? "").trim()).filter(Boolean).join(", ");
    const bKey = [b.name, b.county, b.state, b.country, b.original].map((x) => (x ?? "").trim()).filter(Boolean).join(", ");
    return aKey.localeCompare(bKey, undefined, { sensitivity: "base" });
  });
}

function dedupeDates(dates: AlbumMediaLinkedDate[]): AlbumMediaLinkedDate[] {
  const map = new Map<string, AlbumMediaLinkedDate>();
  for (const d of dates) map.set(d.id, d);
  return [...map.values()].sort((a, b) => {
    const aYear = a.year ?? 99999;
    const bYear = b.year ?? 99999;
    if (aYear !== bYear) return aYear - bYear;
    return (a.original ?? "").localeCompare(b.original ?? "", undefined, { sensitivity: "base" });
  });
}

async function collectLinkedPlacesAndDatesForMediaIds(
  prisma: PrismaClient,
  fileUuid: string,
  mediaIds: string[],
): Promise<{
  linkedPlaces: AlbumMediaLinkedPlace[];
  linkedDates: AlbumMediaLinkedDate[];
  perMedia: Map<string, { linkedPlaces: AlbumMediaLinkedPlace[]; linkedDates: AlbumMediaLinkedDate[] }>;
}> {
  if (mediaIds.length === 0) {
    return { linkedPlaces: [], linkedDates: [], perMedia: new Map() };
  }

  const mediaRows = await prisma.gedcomMedia.findMany({
    where: { fileUuid, id: { in: mediaIds } },
    select: {
      id: true,
      placeLinks: {
        select: {
          place: {
            select: { id: true, original: true, name: true, county: true, state: true, country: true },
          },
        },
      },
      dateLinks: {
        select: {
          date: {
            select: {
              id: true,
              original: true,
              dateType: true,
              year: true,
              month: true,
              day: true,
              endYear: true,
              endMonth: true,
              endDay: true,
            },
          },
        },
      },
    },
  });

  const perMedia = new Map<string, { linkedPlaces: AlbumMediaLinkedPlace[]; linkedDates: AlbumMediaLinkedDate[] }>();
  for (const row of mediaRows) {
    const linkedPlaces = dedupePlaces(
      row.placeLinks
        .map((r) => r.place)
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p) => ({
          id: p.id,
          original: p.original,
          name: p.name,
          county: p.county,
          state: p.state,
          country: p.country,
        })),
    );
    const linkedDates = dedupeDates(
      row.dateLinks
        .map((r) => r.date)
        .filter((d): d is NonNullable<typeof d> => Boolean(d))
        .map((d) => ({
          id: d.id,
          original: d.original,
          dateType: d.dateType,
          year: d.year,
          month: d.month,
          day: d.day,
          endYear: d.endYear,
          endMonth: d.endMonth,
          endDay: d.endDay,
        })),
    );
    perMedia.set(row.id, { linkedPlaces, linkedDates });
  }

  const placeRows = mediaRows.flatMap((m) => m.placeLinks);
  const dateRows = mediaRows.flatMap((m) => m.dateLinks);

  const linkedPlaces = dedupePlaces(
    placeRows
      .map((r: (typeof placeRows)[number]) => r.place)
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({
        id: p.id,
        original: p.original,
        name: p.name,
        county: p.county,
        state: p.state,
        country: p.country,
      })),
  );

  const linkedDates = dedupeDates(
    dateRows
      .map((r: (typeof dateRows)[number]) => r.date)
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
      .map((d) => ({
        id: d.id,
        original: d.original,
        dateType: d.dateType,
        year: d.year,
        month: d.month,
        day: d.day,
        endYear: d.endYear,
        endMonth: d.endMonth,
        endDay: d.endDay,
      })),
  );

  return { linkedPlaces, linkedDates, perMedia };
}

function computeAvailableMediaTypes(media: MediaSummary[]): Array<{
  type: "image" | "video" | "audio" | "document" | "other";
  count: number;
}> {
  const order = ["image", "video", "audio", "document", "other"] as const;
  const counts = { image: 0, video: 0, audio: 0, document: 0, other: 0 };
  for (const m of media) {
    counts[inferMediaBucketKind(m)] += 1;
  }
  return order.filter((t) => counts[t] > 0).map((type) => ({ type, count: counts[type] }));
}

async function mediaRowsForIds(prisma: PrismaClient, fileUuid: string, ids: string[]): Promise<MediaSummary[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.gedcomMedia.findMany({
    where: { fileUuid, id: { in: ids } },
    select: MEDIA_SELECT,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toSummary);
}

/**
 * Public curated album: must be marked public; all junction OBJE rows must belong to this tree.
 * Returns a static grid payload (full `media` list) for the public site (no admin junction pagination).
 */
export async function resolveCuratedAlbumViewModelPublic(
  prisma: PrismaClient,
  fileUuid: string,
  albumId: string,
): Promise<AlbumViewModel | null> {
  const album = await prisma.album.findFirst({
    where: { id: albumId, isPublic: true },
    select: {
      id: true,
      name: true,
      description: true,
      coverMediaId: true,
      isPublic: true,
      createdAt: true,
    },
  });
  if (!album) return null;

  const stray = await prisma.albumGedcomMedia.count({
    where: { albumId, gedcomMedia: { fileUuid: { not: fileUuid } } },
  });
  if (stray > 0) return null;

  const joins = await prisma.albumGedcomMedia.findMany({
    where: { albumId, gedcomMedia: { fileUuid } },
    select: { gedcomMedia: { select: MEDIA_SELECT } },
    orderBy: [{ sortOrder: "asc" }, { addedAt: "asc" }],
  });
  const media = dedupeById(joins.map((j) => toSummary(j.gedcomMedia)));

  const mediaIds = media.map((m) => m.id);
  const perMedia = await collectLinkedIndividualsPerMediaId(prisma, fileUuid, mediaIds);
  const { linkedPlaces, linkedDates, perMedia: perMediaPlacesDates } =
    await collectLinkedPlacesAndDatesForMediaIds(prisma, fileUuid, mediaIds);
  const mediaWithLinks = attachPerMediaPlacesAndDates(attachPerMediaLinks(media, perMedia), perMediaPlacesDates);
  const mediaEnriched = await enrichMediaWithDescriptionAndTags(prisma, fileUuid, mediaWithLinks);
  const linkedIndividuals = attachMediaCountsToPeople(unionLinkedIndividualsSorted(perMedia), perMedia);
  const availableMediaTypes = computeAvailableMediaTypes(mediaEnriched);

  let coverMedia: MediaSummary | null = null;
  if (album.coverMediaId) {
    const cm = await prisma.gedcomMedia.findFirst({
      where: { id: album.coverMediaId, fileUuid },
      select: MEDIA_SELECT,
    });
    if (cm) {
      const s = toSummary(cm);
      const pd = perMediaPlacesDates.get(s.id);
      coverMedia = {
        ...s,
        linkedIndividuals: perMedia.get(s.id) ?? [],
        linkedPlaces: pd?.linkedPlaces ?? [],
        linkedDates: pd?.linkedDates ?? [],
      };
    }
  }
  if (!coverMedia && mediaEnriched.length > 0) {
    coverMedia = pickCoverMediaFromSummaries(
      mediaEnriched,
      JSON.stringify({ type: "album", albumId }),
    );
  }
  if (coverMedia) {
    const fromList = mediaEnriched.find((x) => x.id === coverMedia!.id);
    if (fromList) {
      coverMedia = fromList;
    } else {
      const [one] = await enrichMediaWithDescriptionAndTags(prisma, fileUuid, [coverMedia]);
      coverMedia = one ?? coverMedia;
    }
  }

  return {
    kind: "curated",
    source: { type: "album", albumId },
    title: album.name,
    description: album.description ?? null,
    albumCreatedAt: album.createdAt.toISOString(),
    coverMedia,
    media: mediaEnriched,
    linkedIndividuals,
    availableMediaTypes,
    totalCount: mediaEnriched.length,
    linkedPlaces,
    linkedDates,
    visibility: "public",
    canEditAlbumMetadata: false,
    canEditMembership: false,
    gridMode: "static",
    albumId: null,
    presentation: "album",
  };
}

export async function resolveGeneratedAlbumViewModelPublic(
  prisma: PrismaClient,
  fileUuid: string,
  source: Exclude<AlbumViewSource, { type: "album" }>,
): Promise<AlbumViewModel> {
  const { title, mediaIds, preferredCoverMediaId } = await collectMediaIdsForGenerated(prisma, fileUuid, source);
  const uniqueIds = [...new Set(mediaIds)];
  const inTreeIds = uniqueIds.length
    ? (await prisma.gedcomMedia.findMany({
        where: { fileUuid, id: { in: uniqueIds } },
        select: { id: true },
      })).map((r) => r.id)
    : [];
  const media = await mediaRowsForIds(prisma, fileUuid, inTreeIds);
  const deduped = dedupeById(media);
  const stableKey = JSON.stringify(source);

  const mediaIdsGen = deduped.map((m) => m.id);
  const perMedia = await collectLinkedIndividualsPerMediaId(prisma, fileUuid, mediaIdsGen);
  const { linkedPlaces, linkedDates, perMedia: perMediaPlacesDates } =
    await collectLinkedPlacesAndDatesForMediaIds(prisma, fileUuid, mediaIdsGen);
  const mediaWithLinks = attachPerMediaPlacesAndDates(attachPerMediaLinks(deduped, perMedia), perMediaPlacesDates);
  const mediaEnriched = await enrichMediaWithDescriptionAndTags(prisma, fileUuid, mediaWithLinks);
  const linkedIndividuals = attachMediaCountsToPeople(unionLinkedIndividualsSorted(perMedia), perMedia);
  const coverMedia = resolveAlbumCoverMedia(preferredCoverMediaId, mediaEnriched, stableKey);
  const availableMediaTypes = computeAvailableMediaTypes(mediaEnriched);

  return {
    kind: "generated",
    source,
    title,
    description: null,
    coverMedia,
    media: mediaEnriched,
    linkedIndividuals,
    availableMediaTypes,
    totalCount: mediaEnriched.length,
    linkedPlaces,
    linkedDates,
    visibility: "public",
    canEditAlbumMetadata: false,
    canEditMembership: false,
    gridMode: "static",
    albumId: null,
    presentation: "album",
  };
}
