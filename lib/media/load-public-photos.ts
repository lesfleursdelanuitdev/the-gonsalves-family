import { gedcomNameToDisplayName } from "@ligneous/album-view";
import { prisma } from "@/lib/database/prisma";
import {
  GEDCOM_PLACE_DISPLAY_SELECT,
  fullPlaceLabelFromGedcomPlace,
} from "@/lib/gedcom-place-display";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import { isRasterGedcomMediaForm } from "@/lib/tree/individual-display-photo";
import { resolveTreeFileUuid } from "@/lib/tree";
import { resolveMainPhotosViewModelPublic } from "@/lib/album/resolve-public-album-view-model";
import type { PhotoLink, PhotoListItem } from "@/components/photos/types";

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

function familyLabel(
  husband: { fullName: string | null; xref: string | null } | null,
  wife: { fullName: string | null; xref: string | null } | null,
  xref: string,
): string {
  const h = husband ? personLabel(husband.fullName, husband.xref) : null;
  const w = wife ? personLabel(wife.fullName, wife.xref) : null;
  if (h && w) return `${h} & ${w}`;
  if (h) return h;
  if (w) return w;
  return `Family ${xref.replace(/^@+|@+$/g, "").trim() || xref}`;
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

const PHOTO_SELECT = {
  id: true,
  title: true,
  description: true,
  fileRef: true,
  form: true,
  createdAt: true,
  individualMedia: {
    select: { individual: { select: { id: true, xref: true, fullName: true } } },
  },
  familyMedia: {
    select: {
      family: {
        select: {
          id: true,
          xref: true,
          husband: { select: { xref: true, fullName: true } },
          wife: { select: { xref: true, fullName: true } },
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
 * Loads every public GEDCOM photo (raster image media in the published tree) with
 * the entities it is linked to, normalized for the /archive/photos listing.
 */
export async function loadPublicPhotos(): Promise<PhotoListItem[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  const [rows, viewModel] = await Promise.all([
    prisma.gedcomMedia.findMany({
      where: { fileUuid },
      select: PHOTO_SELECT,
      orderBy: { createdAt: "desc" },
    }),
    // Album-shaped summaries (with linked individuals/places/dates/tags) for the lightbox.
    resolveMainPhotosViewModelPublic(prisma, fileUuid),
  ]);
  const summaryById = new Map(viewModel.media.map((m) => [m.id, m]));

  const items: PhotoListItem[] = [];
  for (const m of rows) {
    if (!m.fileRef || !isRasterGedcomMediaForm(m.form)) continue;
    const src = resolveGedcomMediaFileRef(m.fileRef).trim();
    if (!src) continue;

    const linkedTo: PhotoLink[] = [];
    for (const l of m.individualMedia) {
      linkedTo.push({
        kind: "person",
        label: personLabel(l.individual.fullName, l.individual.xref),
        href: `/individuals/${l.individual.id}`,
      });
    }
    for (const l of m.familyMedia) {
      linkedTo.push({
        kind: "family",
        label: familyLabel(l.family.husband, l.family.wife, l.family.xref),
        href: `/families/${l.family.id}`,
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

    items.push({
      id: m.id,
      filename: fileNameFromRef(m.fileRef),
      title: m.title?.trim() || null,
      description: m.description?.trim() || null,
      src,
      linkedTo,
      createdAt: m.createdAt.toISOString(),
      media: summaryById.get(m.id) ?? {
        id: m.id,
        title: m.title?.trim() || null,
        fileRef: m.fileRef,
        form: m.form,
        description: m.description?.trim() || null,
      },
    });
  }

  return items;
}
