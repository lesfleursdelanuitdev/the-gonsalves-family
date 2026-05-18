"use client";

import type { AlbumMediaTypeFilter } from "@/lib/album/album-media-url-filter";
import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  appendAlbumMediaFilterToSearchParams,
  parseAlbumMediaFilterFromSearchParams,
} from "@/lib/album/album-media-url-filter";

function currentPathWithQuery(pathname: string, searchParams: URLSearchParams): string {
  const qs = searchParams.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Keeps `?media=` in sync with the album media-type filter (read on navigation, write on apply).
 */
export function useAlbumMediaUrlSync(
  setMediaTypeFilter: React.Dispatch<React.SetStateAction<AlbumMediaTypeFilter>>,
  viewKey: string,
) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const replaceUrlForFilter = useCallback(
    (filter: AlbumMediaTypeFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      appendAlbumMediaFilterToSearchParams(params, filter);
      const next = currentPathWithQuery(pathname, params);
      const current = currentPathWithQuery(pathname, searchParams);
      if (next !== current) router.replace(next, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const applyMediaTypeFilter = useCallback(
    (filter: AlbumMediaTypeFilter) => {
      setMediaTypeFilter(filter);
      replaceUrlForFilter(filter);
    },
    [replaceUrlForFilter, setMediaTypeFilter],
  );

  useEffect(() => {
    const fromUrl = parseAlbumMediaFilterFromSearchParams(searchParams);
    setMediaTypeFilter((prev) => (prev === fromUrl ? prev : fromUrl));
  }, [viewKey, searchParams, setMediaTypeFilter]);

  return { applyMediaTypeFilter };
}
