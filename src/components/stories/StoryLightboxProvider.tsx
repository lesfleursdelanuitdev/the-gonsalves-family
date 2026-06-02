"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import type { MediaSummary } from "@ligneous/album-view";
import type { ReaderStoryBlock } from "@/lib/stories/story-reader-utils";
import type { ViewerPage } from "@/lib/stories/story-viewer-utils";

// Code-split the album layout so it isn't shipped to every story reader; it only
// loads the first time a reader opens an image.
const PublicAlbumLightbox = dynamic(
  () => import("@/components/album/PublicAlbumLayout").then((m) => ({ default: m.PublicAlbumLightbox })),
  { ssr: false },
);

/** Set while the story lightbox is open, so the reader's key handlers can stand down. */
export const STORY_LIGHTBOX_OPEN_ATTR = "storyLightbox";

type StoryLightboxContextValue = {
  /** Open the lightbox at the given story media id (no-op if it isn't a resolvable image). */
  open: (mediaId: string) => void;
};

const StoryLightboxContext = createContext<StoryLightboxContextValue | null>(null);

/** Available only inside the public StoryViewer; returns null elsewhere. */
export function useStoryLightbox(): StoryLightboxContextValue | null {
  return useContext(StoryLightboxContext);
}

type StoryMediaResponse = {
  url?: string | null;
  fileRef?: string | null;
  form?: string | null;
  mimeType?: string | null;
  title?: string | null;
};

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "bmp", "tiff", "svg"]);

function isImageMedia(m: StoryMediaResponse): boolean {
  if (m.mimeType) return m.mimeType.startsWith("image/");
  const f = (m.form ?? "").toLowerCase();
  if (!f) return true;
  return IMAGE_EXTS.has(f);
}

/** Strip sanitised caption HTML (`<p>…</p>`, `<br>`, links) to plain text for the details panel. */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type CollectedMedia = { id: string; caption: string };

/** Collect media blocks (id + caption) in reading order, descending into the nested block kinds. */
function collectMediaItems(blocks: ReaderStoryBlock[], out: CollectedMedia[], seen: Set<string>): void {
  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    const type = b.type;
    if (type === "media") {
      const mid = typeof b.mediaId === "string" ? b.mediaId.trim() : "";
      if (mid && !seen.has(mid)) {
        seen.add(mid);
        const caption = typeof b.caption === "string" ? b.caption.trim() : "";
        out.push({ id: mid, caption });
      }
      continue;
    }
    if (type === "columns") {
      const cols = (b.columns as Array<{ blocks?: ReaderStoryBlock[] }> | undefined) ?? [];
      for (const c of cols) collectMediaItems(c.blocks ?? [], out, seen);
    } else if (type === "container") {
      collectMediaItems((b.children as ReaderStoryBlock[] | undefined) ?? [], out, seen);
    } else if (type === "splitContent") {
      const text = b.text as ReaderStoryBlock | undefined;
      if (text) collectMediaItems([text], out, seen);
      const supporting = b.supporting as { blocks?: ReaderStoryBlock[] } | undefined;
      collectMediaItems(supporting?.blocks ?? [], out, seen);
    }
  }
}

export function StoryLightboxProvider({
  pages,
  storyTitle,
  children,
}: {
  pages: ViewerPage[];
  storyTitle?: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<MediaSummary[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const builtRef = useRef(false);
  const buildingRef = useRef<Promise<MediaSummary[]> | null>(null);

  // Unique section ids in reading order (a section may span several pages).
  const sectionIds = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const p of pages) {
      if ((p.pageKind === "body" || p.pageKind === "essay") && p.sectionId && !seen.has(p.sectionId)) {
        seen.add(p.sectionId);
        ids.push(p.sectionId);
      }
    }
    return ids;
  }, [pages]);

  // Build the whole-story image set once, lazily. Cached after the first run.
  const buildGallery = useCallback(async (): Promise<MediaSummary[]> => {
    if (builtRef.current) return items;
    if (buildingRef.current) return buildingRef.current;

    const promise = (async () => {
      const sections = await Promise.all(
        sectionIds.map(async (id) => {
          try {
            const res = await fetch(`/api/story-section/${encodeURIComponent(id)}`);
            if (!res.ok) return [] as ReaderStoryBlock[];
            const data = (await res.json()) as { blocks?: ReaderStoryBlock[] };
            return Array.isArray(data.blocks) ? data.blocks : [];
          } catch {
            return [] as ReaderStoryBlock[];
          }
        }),
      );

      const collected: CollectedMedia[] = [];
      const seenIds = new Set<string>();
      for (const blocks of sections) collectMediaItems(blocks, collected, seenIds);

      const resolved = await Promise.all(
        collected.map(async (item): Promise<MediaSummary | null> => {
          try {
            const res = await fetch(`/api/story-media/${encodeURIComponent(item.id)}`);
            if (!res.ok) return null;
            const data = (await res.json()) as StoryMediaResponse;
            const ref = data.fileRef?.trim();
            if (!ref || !isImageMedia(data)) return null;
            const description = item.caption ? htmlToPlainText(item.caption) || null : null;
            return { id: item.id, title: data.title ?? null, fileRef: ref, form: data.form ?? null, description };
          } catch {
            return null;
          }
        }),
      );

      const built = resolved.filter((m): m is MediaSummary => m != null);
      builtRef.current = true;
      setItems(built);
      return built;
    })();

    buildingRef.current = promise;
    return promise;
  }, [sectionIds, items]);

  const open = useCallback(
    (mediaId: string) => {
      void buildGallery().then((built) => {
        const i = built.findIndex((m) => m.id === mediaId);
        if (i >= 0) setIndex(i);
      });
    },
    [buildGallery],
  );

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(() => setIndex((i) => (i == null || i <= 0 ? i : i - 1)), []);
  const next = useCallback(
    () => setIndex((i) => (i == null || i >= items.length - 1 ? i : i + 1)),
    [items.length],
  );
  const slideshowAdvance = useCallback(
    () =>
      setIndex((i) => {
        if (i == null || items.length <= 1) return i;
        return (i + 1) % items.length;
      }),
    [items.length],
  );

  const shareCurrent = useCallback(
    async (m: MediaSummary) => {
      if (typeof window === "undefined") return;
      const url = `${window.location.origin}/media/${encodeURIComponent(m.id)}`;
      const title = (m.title ?? "").trim() || storyTitle || "Shared image";
      try {
        if (navigator.share) await navigator.share({ title, url });
        else await navigator.clipboard.writeText(url);
      } catch {
        /* user cancelled or clipboard blocked */
      }
    },
    [storyTitle],
  );

  const viewCurrent = useCallback((m: MediaSummary) => {
    if (typeof window === "undefined") return;
    window.location.href = `/media/${encodeURIComponent(m.id)}`;
  }, []);

  const value = useMemo<StoryLightboxContextValue>(() => ({ open }), [open]);
  const lightboxOpen = index != null && index >= 0 && index < items.length;

  // Flag the body so the StoryViewer's window key handlers (page-turn arrows) stand
  // down while the lightbox owns the keyboard.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (lightboxOpen) {
      document.body.dataset[STORY_LIGHTBOX_OPEN_ATTR] = "open";
      return () => {
        delete document.body.dataset[STORY_LIGHTBOX_OPEN_ATTR];
      };
    }
  }, [lightboxOpen]);

  return (
    <StoryLightboxContext.Provider value={value}>
      {children}
      {lightboxOpen ? (
        <PublicAlbumLightbox
          items={items}
          index={index!}
          onClose={close}
          onPrev={prev}
          onNext={next}
          onSlideshowAdvance={slideshowAdvance}
          onShareCurrent={(m) => void shareCurrent(m)}
          onViewCurrent={viewCurrent}
        />
      ) : null}
    </StoryLightboxContext.Provider>
  );
}
