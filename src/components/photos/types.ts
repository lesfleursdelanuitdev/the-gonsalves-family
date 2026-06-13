import type { MediaSummary } from "@ligneous/album-view";

export type PhotoLinkKind = "person" | "family" | "event" | "place" | "source";

export type PhotoLink = {
  kind: PhotoLinkKind;
  label: string;
  href: string;
};

export type PhotoListItem = {
  id: string;
  /** Original file name, derived from the stored media path. */
  filename: string;
  /** GEDCOM media title, when it adds something beyond the filename. */
  title: string | null;
  description: string | null;
  /** Resolved public image URL. */
  src: string;
  /** What this photo is attached to in the tree (people, families, events, …). */
  linkedTo: PhotoLink[];
  /** ISO timestamp; sorts chronologically as a string. */
  createdAt: string;
  /** Album-shaped summary (with linked individuals/places/dates/tags) for the lightbox. */
  media: MediaSummary;
};

export type PhotosLinkFilter = "all" | PhotoLinkKind | "unlinked";
export type TriFilter = "all" | "yes" | "no";

export type PhotosFilterState = {
  linkedTo: PhotosLinkFilter;
  hasDescription: TriFilter;
};

export const EMPTY_PHOTOS_FILTERS: PhotosFilterState = {
  linkedTo: "all",
  hasDescription: "all",
};
