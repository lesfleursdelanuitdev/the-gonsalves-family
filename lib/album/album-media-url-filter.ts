import type { MediaBucketKind } from "@ligneous/album-view";

/** Panel + URL filter values (matches {@link AlbumMediaTypeFilter} in the filter UI). */
export type AlbumMediaTypeFilter = "all" | MediaBucketKind;

/** Query param on album routes, e.g. `?media=video`. */
export const ALBUM_MEDIA_FILTER_PARAM = "media";

/** Values stored in the URL (aligned with Media hub `?collection=` where possible). */
export type AlbumMediaUrlValue = "mixed" | "photos" | "documents" | "video" | "audio" | "other";

const URL_VALUES = new Set<string>(["mixed", "photos", "documents", "video", "audio", "other", "image", "document"]);

/**
 * Parse `?media=` (or legacy `?collection=` on album pages) into a panel filter value.
 */
export function parseAlbumMediaFilterFromSearchParams(
  sp: Pick<URLSearchParams, "get">,
): AlbumMediaTypeFilter {
  const raw = (sp.get(ALBUM_MEDIA_FILTER_PARAM) ?? sp.get("collection") ?? "").trim().toLowerCase();
  if (!raw || raw === "mixed" || raw === "all") return "all";
  if (!URL_VALUES.has(raw)) return "all";
  return albumUrlValueToPanelFilter(raw as AlbumMediaUrlValue | MediaBucketKind);
}

export function albumUrlValueToPanelFilter(value: AlbumMediaUrlValue | MediaBucketKind): AlbumMediaTypeFilter {
  switch (value) {
    case "photos":
    case "image":
      return "image";
    case "documents":
    case "document":
      return "document";
    case "video":
      return "video";
    case "audio":
      return "audio";
    case "other":
      return "other";
    default:
      return "all";
  }
}

/** Serialize panel filter to a URL value; `null` means omit the param (mixed / all). */
export function panelMediaFilterToQueryValue(filter: AlbumMediaTypeFilter): AlbumMediaUrlValue | null {
  switch (filter) {
    case "image":
      return "photos";
    case "document":
      return "documents";
    case "video":
      return "video";
    case "audio":
      return "audio";
    case "other":
      return "other";
    default:
      return null;
  }
}

export function appendAlbumMediaFilterToSearchParams(
  params: URLSearchParams,
  filter: AlbumMediaTypeFilter,
): void {
  const qv = panelMediaFilterToQueryValue(filter);
  if (qv) params.set(ALBUM_MEDIA_FILTER_PARAM, qv);
  else {
    params.delete(ALBUM_MEDIA_FILTER_PARAM);
    params.delete("collection");
  }
}

export function appendAlbumMediaFilterQuery(pathWithOptionalQuery: string, filter: AlbumMediaTypeFilter): string {
  const qIndex = pathWithOptionalQuery.indexOf("?");
  const path = qIndex >= 0 ? pathWithOptionalQuery.slice(0, qIndex) : pathWithOptionalQuery;
  const params = new URLSearchParams(qIndex >= 0 ? pathWithOptionalQuery.slice(qIndex + 1) : "");
  appendAlbumMediaFilterToSearchParams(params, filter);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
