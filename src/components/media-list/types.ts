import type { MediaSummary } from "@ligneous/album-view";

export type MediaBucket = "image" | "document" | "audio" | "video";

export type MediaLinkKind = "person" | "family" | "event" | "place" | "source";

export type MediaLink = {
  kind: MediaLinkKind;
  label: string;
  href: string;
};

export type MediaListItem = {
  id: string;
  /** Original file name, derived from the stored media path. */
  filename: string;
  /** GEDCOM media title, when it adds something beyond the filename. */
  title: string | null;
  description: string | null;
  bucket: MediaBucket;
  /** Resolved public file URL (image src, or audio/video/document file). */
  fileUrl: string;
  /** What this media is attached to in the tree (people, families, events, …). */
  linkedTo: MediaLink[];
  /** ISO timestamp; sorts chronologically as a string. */
  createdAt: string;
  /** Album-shaped summary (with linked individuals/places/dates/tags); used by the image lightbox. */
  media: MediaSummary;
};

export type MediaLinkFilter = "all" | MediaLinkKind | "unlinked";
export type TriFilter = "all" | "yes" | "no";

export type MediaFilterState = {
  linkedTo: MediaLinkFilter;
  hasDescription: TriFilter;
};

export const EMPTY_MEDIA_FILTERS: MediaFilterState = {
  linkedTo: "all",
  hasDescription: "all",
};

/** Per-bucket display copy + behavior for the shared media-list page. */
export type MediaBucketConfig = {
  /** Page H1 + breadcrumb leaf. */
  title: string;
  /** Plural noun for the count label, e.g. "12 Documents". */
  entityName: string;
  /** Lowercase noun for placeholders, e.g. "Search documents...". */
  noun: string;
  description: string;
  emptyMessage: string;
};

export const MEDIA_BUCKET_CONFIG: Record<MediaBucket, MediaBucketConfig> = {
  image: {
    title: "Photos",
    entityName: "Photos",
    noun: "photos",
    description:
      "Preserved family images from our tree. Search and filter to find photos by file name, description, or who and what they are linked to.",
    emptyMessage: "No photos match this search.",
  },
  document: {
    title: "Documents",
    entityName: "Documents",
    noun: "documents",
    description:
      "Letters, records, and other family papers. Search and filter by file name, description, or who and what they are linked to.",
    emptyMessage: "No documents match this search.",
  },
  audio: {
    title: "Audio",
    entityName: "Audio files",
    noun: "audio",
    description:
      "Voices and recordings from the family. Search and filter by file name, description, or who and what they are linked to.",
    emptyMessage: "No audio matches this search.",
  },
  video: {
    title: "Videos",
    entityName: "Videos",
    noun: "videos",
    description:
      "Moving image archive. Search and filter by file name, description, or who and what they are linked to.",
    emptyMessage: "No videos match this search.",
  },
};
