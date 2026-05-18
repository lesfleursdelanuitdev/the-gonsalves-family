import type { AlbumViewSource } from "@ligneous/album-view";
import type { MediaBucketKind } from "@ligneous/album-view";
import { appendAlbumMediaFilterQuery } from "@/lib/album/album-media-url-filter";

export type AlbumPathMediaFilter = "all" | MediaBucketKind;

function encodeGeneratedSource(source: Exclude<AlbumViewSource, { type: "album" }>): string {
  switch (source.type) {
    case "individual":
      return `type=individual&id=${encodeURIComponent(source.individualId)}`;
    case "family":
      return `type=family&id=${encodeURIComponent(source.familyId)}`;
    case "event":
      return `type=event&id=${encodeURIComponent(source.eventId)}`;
    case "place":
      return `type=place&id=${encodeURIComponent(source.placeId)}`;
    case "note":
      return `type=note&id=${encodeURIComponent(source.noteId)}`;
    case "date":
      return `type=date&id=${encodeURIComponent(source.dateId)}`;
    case "tag":
      return `type=tag&id=${encodeURIComponent(source.tagId)}`;
    default:
      return "";
  }
}

export function sourceToAlbumPath(
  source: AlbumViewSource,
  options?: { media?: AlbumPathMediaFilter },
): string {
  const media = options?.media;
  if (source.type === "album") {
    const base = `/media/album/${encodeURIComponent(source.albumId)}`;
    return media && media !== "all" ? appendAlbumMediaFilterQuery(base, media) : base;
  }
  const q = encodeGeneratedSource(source);
  const base = `/media/album-view?kind=generated&${q}`;
  return media && media !== "all" ? appendAlbumMediaFilterQuery(base, media) : base;
}

export function sourceToAlbumApiQuery(source: AlbumViewSource): string {
  if (source.type === "album") return `kind=curated&albumId=${encodeURIComponent(source.albumId)}`;
  const q = encodeGeneratedSource(source);
  return `kind=generated&${q}`;
}

export function buildPublicMediaPath(source: AlbumViewSource, mediaId: string): string {
  const id = encodeURIComponent(mediaId);
  const sourceQuery = sourceToAlbumApiQuery(source);
  return `/media/${id}?${sourceQuery}`;
}

export function parseSourceFromSearchParams(
  sp: Pick<URLSearchParams, "get">,
): AlbumViewSource | null {
  const kind = (sp.get("kind") ?? "").trim().toLowerCase();
  if (kind === "curated") {
    const albumId = (sp.get("albumId") ?? "").trim();
    return albumId ? { type: "album", albumId } : null;
  }
  if (kind === "generated") {
    const type = (sp.get("type") ?? "").trim().toLowerCase();
    const id = (sp.get("id") ?? "").trim();
    if (!id) return null;
    switch (type) {
      case "individual":
        return { type: "individual", individualId: id };
      case "family":
        return { type: "family", familyId: id };
      case "event":
        return { type: "event", eventId: id };
      case "place":
        return { type: "place", placeId: id };
      case "note":
        return { type: "note", noteId: id };
      case "date":
        return { type: "date", dateId: id };
      case "tag":
        return { type: "tag", tagId: id };
      default:
        return null;
    }
  }
  return null;
}
