import { gedcomNameToDisplayName, inferMediaBucketKind, type MediaSummary } from "@ligneous/album-view";
import { prisma } from "@/lib/database/prisma";
import {
  buildMediaLoginPath,
  isMediaLinkedToAnyLivingPeople,
  LIVING_MEDIA_PLACEHOLDER_COVER,
  shouldGateLivingLinkedEntity,
} from "@/lib/auth/living-exclusive-media";
import {
  buildCollapsedPersonMediaLinks,
  collectUniquePersonLinksFromMediaRow,
} from "@/lib/auth/living-person-privacy";
import type { PublicViewer } from "@/lib/auth/public-viewer";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { buildLoginWallPath } from "@/lib/auth/public-viewer";
import {
  GEDCOM_PLACE_DISPLAY_SELECT,
  fullPlaceLabelFromGedcomPlace,
} from "@/lib/gedcom-place-display";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import { isRasterGedcomMediaForm } from "@/lib/tree/individual-display-photo";
import { resolveTreeFileUuid } from "@/lib/tree";
import { resolveMainPhotosViewModelPublic } from "@/lib/album/resolve-public-album-view-model";
import type { MediaBucket, MediaLink, MediaListItem } from "@/components/media-list/types";

const EVENT_TYPE_LABELS: Record<string, string> = {
  BIRT: "Birth",
  DEAT: "Death",
  MARR: "Marriage",
  DIV: "Divorce",
  BURI: "Burial",
  RESI: "Residence",
  IMMI: "Immigration",
  EMIG: "Emigration",
  NATU: "Naturalization",
  CENS: "Census",
  GRAD: "Graduation",
  OCCU: "Occupation",
  BAPM: "Baptism",
  CHR: "Christening",
};

function personLabel(fullName: string | null, xref: string | null): string {
  return gedcomNameToDisplayName(fullName ?? null, xref ?? "") || xref || "Unknown";
}

function eventLabel(eventType: string | null, customType: string | null): string {
  const type = (eventType ?? "").toUpperCase();
  return EVENT_TYPE_LABELS[type] ?? customType?.trim() ?? eventType ?? "Event";
}

function sourceLabel(source: {
  xref: string;
  title: string | null;
  author: string | null;
  abbreviation: string | null;
}): string {
  return (
    source.title?.trim() ||
    source.abbreviation?.trim() ||
    source.author?.trim() ||
    `Source ${source.xref.replace(/^@+|@+$/g, "").trim() || source.xref}`
  );
}

/** Original file name from a stored path like `/uploads/gedcom-admin/images/<file>`. */
function fileNameFromRef(fileRef: string): string {
  const withoutQuery = fileRef.split(/[?#]/)[0];
  const base = withoutQuery.slice(withoutQuery.lastIndexOf("/") + 1);
  try {
    return decodeURIComponent(base) || fileRef;
  } catch {
    return base || fileRef;
  }
}

/** Image bucket uses the raster check (matches the lightbox source); others use the album classifier. */
function matchesBucket(summary: MediaSummary, bucket: MediaBucket): boolean {
  if (bucket === "image") return isRasterGedcomMediaForm(summary.form);
  return inferMediaBucketKind(summary) === bucket;
}

const MEDIA_SELECT = {
  id: true,
  title: true,
  description: true,
  fileRef: true,
  form: true,
  createdAt: true,
  individualMedia: {
    select: { individual: { select: { id: true, xref: true, fullName: true, isLiving: true } } },
  },
  individualProfileFor: {
    select: { individual: { select: { id: true, xref: true, fullName: true, isLiving: true } } },
  },
  familyMedia: {
    select: {
      family: {
        select: {
          id: true,
          xref: true,
          husband: { select: { id: true, xref: true, fullName: true, isLiving: true } },
          wife: { select: { id: true, xref: true, fullName: true, isLiving: true } },
        },
      },
    },
  },
  familyProfileFor: {
    select: {
      family: {
        select: {
          husband: { select: { id: true, isLiving: true } },
          wife: { select: { id: true, isLiving: true } },
        },
      },
    },
  },
  eventMedia: {
    select: { event: { select: { id: true, eventType: true, customType: true } } },
  },
  placeLinks: {
    select: { place: { select: { id: true, ...GEDCOM_PLACE_DISPLAY_SELECT } } },
  },
  sourceMedia: {
    select: {
      source: { select: { id: true, xref: true, title: true, author: true, abbreviation: true } },
    },
  },
};

/**
 * Loads public GEDCOM media for one bucket (image/document/audio/video) with the
 * entities each item is linked to, normalized for the /archive/* listing pages.
 * For the image bucket, each item also carries an album-shaped summary (with
 * linked individuals/places/dates/tags) for the shared lightbox.
 */
export async function loadPublicMedia(
  bucket: MediaBucket,
  viewer?: PublicViewer,
): Promise<MediaListItem[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];
  const resolvedViewer = viewer ?? (await resolvePublicViewer());

  const [rows, summaryById] = await Promise.all([
    prisma.gedcomMedia.findMany({
      where: { fileUuid },
      select: MEDIA_SELECT,
      orderBy: { createdAt: "desc" },
    }),
    bucket === "image"
      ? resolveMainPhotosViewModelPublic(prisma, fileUuid).then(
          (vm) => new Map(vm.media.map((m) => [m.id, m] as const)),
        )
      : Promise.resolve(new Map<string, MediaSummary>()),
  ]);

  const items: MediaListItem[] = [];
  for (const m of rows) {
    if (!m.fileRef) continue;
    const basicSummary: MediaSummary = {
      id: m.id,
      title: m.title?.trim() || null,
      fileRef: m.fileRef,
      form: m.form,
      description: m.description?.trim() || null,
    };
    if (!matchesBucket(basicSummary, bucket)) continue;
    const fileUrl = resolveGedcomMediaFileRef(m.fileRef).trim();
    if (!fileUrl) continue;

    const hasLivingLinked = isMediaLinkedToAnyLivingPeople(m);
    const privacyRestricted = shouldGateLivingLinkedEntity(resolvedViewer, hasLivingLinked);

    const linkedTo: MediaLink[] = [];
    const personHref = (individualId: string) =>
      privacyRestricted
        ? buildLoginWallPath(`/individuals/${individualId}`)
        : `/individuals/${individualId}`;

    const personLinks = buildCollapsedPersonMediaLinks({
      people: collectUniquePersonLinksFromMediaRow(m),
      viewer: resolvedViewer,
      personLabel,
      personHref,
    });
    for (const link of personLinks) {
      linkedTo.push({
        kind: "person",
        label: link.label,
        href: link.href,
        isLivingSummary: link.isLivingSummary,
      });
    }

    for (const l of m.eventMedia) {
      linkedTo.push({
        kind: "event",
        label: eventLabel(l.event.eventType, l.event.customType),
        href: `/tree/events/${l.event.id}`,
      });
    }
    for (const l of m.placeLinks) {
      const label = fullPlaceLabelFromGedcomPlace(l.place);
      if (label) linkedTo.push({ kind: "place", label, href: `/tree/places/${l.place.id}` });
    }
    for (const l of m.sourceMedia) {
      linkedTo.push({
        kind: "source",
        label: sourceLabel(l.source),
        href: `/research/sources#source-${l.source.id}`,
      });
    }

    const mainPhotosQuery = "kind=mainPhotos";
    const loginHref = privacyRestricted ? buildMediaLoginPath(m.id, mainPhotosQuery) : undefined;
    const displayFileUrl = privacyRestricted ? LIVING_MEDIA_PLACEHOLDER_COVER : fileUrl;
    const summary = summaryById.get(m.id) ?? basicSummary;
    const publicSummary: MediaSummary = privacyRestricted
      ? { ...summary, fileRef: null }
      : summary;

    items.push({
      id: m.id,
      filename: fileNameFromRef(m.fileRef),
      title: m.title?.trim() || null,
      description: m.description?.trim() || null,
      bucket,
      fileUrl: displayFileUrl,
      linkedTo,
      createdAt: m.createdAt.toISOString(),
      media: publicSummary,
      privacyRestricted,
      loginHref,
    });
  }

  return items;
}
