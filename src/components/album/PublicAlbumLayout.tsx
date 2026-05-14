"use client";

import type {
  AlbumMediaLinkedDate,
  AlbumMediaLinkedIndividual,
  AlbumMediaLinkedPlace,
  AlbumMediaLinkedTag,
  AlbumViewModel,
  MediaBucketKind,
  MediaSummary,
} from "@ligneous/album-view";
import { inferMediaBucketKind, matchesAlbumIndividualSearch } from "@ligneous/album-view";
import type { AlbumMediaDateRangeFilter } from "@/lib/album/album-media-filter-utils";
import {
  buildPlacesWithCounts,
  buildTagsWithCounts,
  dateRangeFilterIsActive,
  formatAlbumLinkedPlaceLabel,
  mediaMatchesDateRangeFilter,
  summarizeDateRangeFilter,
} from "@/lib/album/album-media-filter-utils";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Globe,
  ImageIcon,
  LayoutGrid,
  Leaf,
  List,
  Pause,
  Play,
  Share2,
  Tag,
  TreePine,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlbumMediaFilterPanel, type AlbumMediaTypeFilter } from "./AlbumMediaFilterPanel";
import { LightboxZoomableImage } from "./LightboxZoomableImage";
import { buildPublicMediaPath } from "@/lib/album/public-album-links";
import { formatGedcomDateDisplayLabel } from "@/lib/gedcom/format-gedcom-date-display";

function normalizeSiteMediaPath(ref: string): string {
  const t = ref.trim();
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/")) return t.replace(/^\/+/, "/");
  return t;
}

function isLikelyRasterImage(fileRef: string, formStr: string): boolean {
  const f = normalizeSiteMediaPath(fileRef).trim().toLowerCase();
  if (/\.(jpe?g|png|gif|webp|avif|bmp|heic|heif|tiff?)(\?|$)/i.test(f)) return true;
  const fm = (formStr || "").toLowerCase();
  if (/\b(jpe?g|png|gif|webp|avif|bmp|heic|heif|tiff?)\b/.test(fm)) return true;
  return false;
}

/** Public album filter buckets — aligned with {@link inferMediaBucketKind}. */
export type PublicAlbumMediaKind = MediaBucketKind;
export type PublicAlbumMediaTypeFilter = AlbumMediaTypeFilter;

function rasterSrc(m: MediaSummary): string | null {
  const ref = (m.fileRef ?? "").trim();
  if (!ref || !isLikelyRasterImage(ref, m.form ?? "")) return null;
  const resolved = resolveGedcomMediaFileRef(normalizeSiteMediaPath(ref));
  if (!resolved) return null;
  if (
    resolved.startsWith("/") ||
    resolved.startsWith("http://") ||
    resolved.startsWith("https://")
  ) {
    return resolved;
  }
  return null;
}

function formatAlbumDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function formatAboutPlaceLabel(p: {
  original: string;
  name: string | null;
  county: string | null;
  state: string | null;
  country: string | null;
}): string {
  const structured = [p.name, p.county, p.state, p.country]
    .map((x) => (x ?? "").trim())
    .filter(Boolean)
    .join(", ");
  const orig = (p.original ?? "").trim();
  if (structured && orig && orig !== structured) return `${structured} - ${orig}`;
  return structured || orig || "Unknown place";
}

function mediaTypeFilterLabel(
  t: PublicAlbumMediaTypeFilter,
  counts: Record<PublicAlbumMediaKind, number>,
  totalAll: number,
): string {
  switch (t) {
    case "all":
      return `All types (${totalAll})`;
    case "image":
      return `Images (${counts.image})`;
    case "video":
      return `Video (${counts.video})`;
    case "audio":
      return `Audio (${counts.audio})`;
    case "document":
      return `Documents (${counts.document})`;
    case "other":
      return `Other (${counts.other})`;
    default:
      return `All types (${totalAll})`;
  }
}

const EMPTY_DATE_RANGE: AlbumMediaDateRangeFilter = { from: "", to: "", includeUnknown: false };

function buildFilterButtonLabel(
  mediaTypeFilter: PublicAlbumMediaTypeFilter,
  personFilterIds: string[],
  placeFilterIds: string[],
  tagFilterIds: string[],
  dateRange: AlbumMediaDateRangeFilter,
  linked: AlbumMediaLinkedIndividual[],
  linkedPlacesCatalog: AlbumMediaLinkedPlace[],
  linkedTagsCatalog: { id: string; name: string }[],
  totalAll: number,
  mediaKindCounts: Record<PublicAlbumMediaKind, number>,
): string {
  const names = personFilterIds
    .map((id) => linked.find((p) => p.id === id)?.displayName)
    .filter((n): n is string => Boolean(n));
  const n = names.length;
  const typeWord =
    mediaTypeFilter === "all"
      ? null
      : mediaTypeFilter === "image"
        ? "Images"
        : mediaTypeFilter === "video"
          ? "Video"
          : mediaTypeFilter === "audio"
            ? "Audio"
            : mediaTypeFilter === "document"
              ? "Documents"
              : "Other";
  const placeLabels = placeFilterIds
    .map((id) => linkedPlacesCatalog.find((p) => p.id === id))
    .filter((p): p is AlbumMediaLinkedPlace => Boolean(p))
    .map((p) => formatAlbumLinkedPlaceLabel(p));
  const tagLabels = tagFilterIds
    .map((id) => linkedTagsCatalog.find((t) => t.id === id)?.name)
    .filter((x): x is string => Boolean(x));
  const dateActive = dateRangeFilterIsActive(dateRange);
  const dateShort = dateActive ? summarizeDateRangeFilter(dateRange) : null;

  const parts: string[] = [];
  if (typeWord) parts.push(typeWord);
  if (n === 1) parts.push(names[0]!);
  else if (n > 1) parts.push(`${n} people`);
  if (placeLabels.length === 1) parts.push(placeLabels[0]!);
  else if (placeLabels.length > 1) parts.push(`${placeLabels.length} places`);
  if (tagLabels.length === 1) parts.push(tagLabels[0]!);
  else if (tagLabels.length > 1) parts.push(`${tagLabels.length} tags`);
  if (dateShort) parts.push(dateShort);

  if (parts.length > 0) return parts.join(" · ");
  if (n === 1) return `People: ${names[0]}`;
  if (n > 1) return `${n} people selected`;
  return mediaTypeFilterLabel(mediaTypeFilter, mediaKindCounts, totalAll);
}

const PAGE_SIZE_OPTIONS = [6, 9, 12, 24] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
const DEFAULT_PAGE_SIZE: PageSizeOption = 12;

function MediaTile({ m, onOpen }: { m: MediaSummary; onOpen: () => void }) {
  const src = rasterSrc(m);
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!src}
      className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg border-0 bg-transparent shadow-none outline-none ring-1 ring-inset ring-black/[0.05] transition-[opacity,transform,box-shadow] duration-200 ease-out focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-[0_8px_22px_rgba(60,45,25,0.1)]"
      aria-label={src ? "Open full-size viewer" : "No preview available"}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- HEIC and cross-origin admin URLs
        <img
          src={src}
          alt=""
          className="size-full object-cover object-center transition-transform duration-200 ease-out will-change-transform group-hover:scale-[1.015] group-active:scale-100 group-disabled:scale-100"
          loading="lazy"
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-surface-inset/40 p-2 text-center text-xs text-muted">
          No preview
        </div>
      )}
    </button>
  );
}

function MediaListRow({ m, onOpen }: { m: MediaSummary; onOpen: () => void }) {
  const src = rasterSrc(m);
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!src}
      className="flex w-full cursor-zoom-in items-center gap-4 rounded-xl border border-border/70 bg-surface-elevated p-3 text-left outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50"
      aria-label={src ? "Open full-size viewer" : "No preview available"}
    >
      <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-surface-inset ring-1 ring-inset ring-black/[0.06] sm:h-20 sm:w-20">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="size-full object-cover object-center" loading="lazy" />
        ) : (
          <div className="flex size-full items-center justify-center text-[10px] text-muted">—</div>
        )}
      </div>
      <span className="min-w-0 flex-1 truncate font-body text-sm font-medium text-heading">
        {(m.title ?? "").trim() || "Untitled"}
      </span>
    </button>
  );
}

const SLIDESHOW_INTERVAL_MS = 4000;

function PublicAlbumLightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
  onSlideshowAdvance,
  onShareCurrent,
  onViewCurrent,
}: {
  items: MediaSummary[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  /** Advance to next item, wrapping to the first after the last (slideshow only). */
  onSlideshowAdvance: () => void;
  onShareCurrent: (m: MediaSummary) => void;
  onViewCurrent: (m: MediaSummary) => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const swipeTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [slideshowPlaying, setSlideshowPlaying] = useState(false);
  const [contentTab, setContentTab] = useState<"image" | "details">("image");
  /** While the image tab is zoomed/panned, disable horizontal swipe-to-advance. */
  const [lightboxZoomPanActive, setLightboxZoomPanActive] = useState(false);
  const m = items[index];
  const src = m ? rasterSrc(m) : null;
  const total = items.length;
  const canNav = total > 1;
  const canShare = Boolean(m);

  const stopSlideshow = useCallback(() => setSlideshowPlaying(false), []);

  const handlePrev = useCallback(() => {
    stopSlideshow();
    onPrev();
  }, [onPrev, stopSlideshow]);

  const handleNext = useCallback(() => {
    stopSlideshow();
    onNext();
  }, [onNext, stopSlideshow]);

  const onSwipePanelTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!canNav) return;
      if (e.touches.length > 1) {
        swipeTouchStartRef.current = null;
        return;
      }
      if (lightboxZoomPanActive && contentTab === "image") {
        swipeTouchStartRef.current = null;
        return;
      }
      const t = e.touches[0];
      swipeTouchStartRef.current = { x: t.clientX, y: t.clientY };
    },
    [canNav, contentTab, lightboxZoomPanActive],
  );

  const onSwipePanelTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!canNav) {
        swipeTouchStartRef.current = null;
        return;
      }
      if (lightboxZoomPanActive && contentTab === "image") {
        swipeTouchStartRef.current = null;
        return;
      }
      const start = swipeTouchStartRef.current;
      swipeTouchStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const minDistance = 56;
      if (Math.abs(dx) < minDistance) return;
      // Prefer vertical scrolling on the Details tab; require a clearly horizontal gesture.
      const horizontalBias = contentTab === "details" ? 1.15 : 0.75;
      if (Math.abs(dy) * horizontalBias > Math.abs(dx)) return;
      // Swipe right → next; swipe left → previous (matches explicit product request).
      if (dx > 0) handleNext();
      else handlePrev();
    },
    [canNav, contentTab, handleNext, handlePrev, lightboxZoomPanActive],
  );

  const onSwipePanelTouchCancel = useCallback(() => {
    swipeTouchStartRef.current = null;
  }, []);

  const onSwipePanelTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length >= 2) swipeTouchStartRef.current = null;
  }, []);

  useEffect(() => {
    closeBtnRef.current?.focus({ preventScroll: true });
  }, [index]);

  useEffect(() => {
    setContentTab("image");
  }, [index]);

  useEffect(() => {
    if (slideshowPlaying) setContentTab("image");
  }, [slideshowPlaying]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (!slideshowPlaying || !canNav) return;
    const id = window.setInterval(() => {
      onSlideshowAdvance();
    }, SLIDESHOW_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [slideshowPlaying, canNav, onSlideshowAdvance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, handlePrev, handleNext]);

  if (typeof document === "undefined") return null;

  const detailTitle = (m?.title ?? "").trim();
  const detailDescription = (m?.description ?? "").trim();
  const detailPlaces: AlbumMediaLinkedPlace[] = m?.linkedPlaces ?? [];
  const detailDates: AlbumMediaLinkedDate[] = m?.linkedDates ?? [];
  const detailTags: AlbumMediaLinkedTag[] = m?.linkedTags ?? [];
  const hasDetailContent =
    Boolean(detailTitle) ||
    Boolean(detailDescription) ||
    detailPlaces.length > 0 ||
    detailDates.length > 0 ||
    detailTags.length > 0;

  const shell = (
    <div
      className="fixed inset-0 z-[10050] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Enlarged media"
        className="font-body relative z-10 flex max-h-[min(100dvh,100svh)] w-full max-w-[min(100vw,1200px)] flex-col overflow-hidden rounded-t-2xl border border-border bg-surface-elevated text-text shadow-[0_8px_40px_rgba(60,45,25,0.1)] sm:max-h-[min(92dvh,920px)] sm:rounded-2xl"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-3 pb-2 pt-1 sm:px-4 sm:pb-3 sm:pt-2">
          <p className="font-body min-w-0 truncate text-sm tabular-nums text-muted">
            {total > 0 ? (
              <>
                <span className="font-medium text-text">{index + 1}</span> of{" "}
                <span className="font-medium text-text">{total}</span>
              </>
            ) : null}
          </p>
          <button
            ref={closeBtnRef}
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} className="shrink-0" aria-hidden />
          </button>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-2 pb-3 sm:px-4 sm:pb-4">
          <div
            role="tabpanel"
            id="album-lightbox-main-panel"
            aria-label={contentTab === "image" ? "Image preview" : "Media details"}
            className="flex h-[min(64dvh,64svh,640px)] min-h-[14rem] w-full shrink-0 flex-col overflow-hidden rounded-xl bg-surface-inset/50 sm:h-[min(66dvh,640px)] sm:min-h-[18rem]"
            onTouchStart={onSwipePanelTouchStart}
            onTouchMove={onSwipePanelTouchMove}
            onTouchEnd={onSwipePanelTouchEnd}
            onTouchCancel={onSwipePanelTouchCancel}
          >
            {contentTab === "image" ? (
              <div className="flex min-h-0 flex-1 flex-col p-2 sm:p-3">
                {src ? (
                  <LightboxZoomableImage
                    src={src}
                    alt=""
                    resetKey={index}
                    onZoomPanActiveChange={setLightboxZoomPanActive}
                    className="min-h-0 flex-1 rounded-lg"
                  />
                ) : (
                  <p className="font-body flex flex-1 items-center justify-center px-4 text-center text-sm text-muted">
                    No preview for this file.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 text-left sm:px-4 sm:py-4">
                {!hasDetailContent ? (
                  <p className="font-body text-center text-sm text-muted">
                    No additional details for this file.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {detailTitle ? (
                      <div>
                        <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b2e2e]">
                          Title
                        </p>
                        <p className="mt-1.5 font-body text-sm font-medium leading-relaxed text-text sm:text-base">
                          {detailTitle}
                        </p>
                      </div>
                    ) : null}
                    {detailDescription ? (
                      <div>
                        <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b2e2e]">
                          Description
                        </p>
                        <p className="mt-1.5 whitespace-pre-wrap font-body text-sm leading-relaxed text-text">
                          {detailDescription}
                        </p>
                      </div>
                    ) : null}
                    {detailPlaces.length > 0 ? (
                      <div className="space-y-2">
                        <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b2e2e]">
                          Places ({detailPlaces.length})
                        </p>
                        <div
                          role="region"
                          aria-label={`Places (${detailPlaces.length})`}
                          className="max-h-40 overflow-y-auto overflow-x-hidden rounded-lg border border-border/50 bg-surface/40 px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:max-h-48"
                        >
                          <ul className="list-none divide-y divide-border/40">
                            {detailPlaces.map((p) => (
                              <li key={p.id} className="font-body py-2 text-sm text-text first:pt-1 last:pb-1">
                                <Link
                                  href={`/media/album-view?kind=generated&type=place&id=${encodeURIComponent(p.id)}`}
                                  className="font-medium text-link underline-offset-2 transition-colors hover:text-link-hover hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                                  aria-label={`View all media for ${formatAboutPlaceLabel(p)}`}
                                >
                                  {formatAboutPlaceLabel(p)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                    {detailDates.length > 0 ? (
                      <div className="space-y-2">
                        <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b2e2e]">
                          Dates ({detailDates.length})
                        </p>
                        <div
                          role="region"
                          aria-label={`Dates (${detailDates.length})`}
                          className="max-h-40 overflow-y-auto overflow-x-hidden rounded-lg border border-border/50 bg-surface/40 px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:max-h-48"
                        >
                          <ul className="list-none divide-y divide-border/40">
                            {detailDates.map((d) => (
                              <li key={d.id} className="font-body py-2 text-sm text-text first:pt-1 last:pb-1">
                                <Link
                                  href={`/media/album-view?kind=generated&type=date&id=${encodeURIComponent(d.id)}`}
                                  className="font-medium text-link underline-offset-2 transition-colors hover:text-link-hover hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                                  aria-label={`View all media for ${formatGedcomDateDisplayLabel(d)}`}
                                >
                                  {formatGedcomDateDisplayLabel(d)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                    {detailTags.length > 0 ? (
                      <div className="space-y-2">
                        <p className="font-heading flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b2e2e]">
                          <Tag className="size-3.5 shrink-0 opacity-90" aria-hidden />
                          Tags ({detailTags.length})
                        </p>
                        <div
                          role="region"
                          aria-label={`Tags (${detailTags.length})`}
                          className="max-h-40 overflow-y-auto overflow-x-hidden rounded-lg border border-border/50 bg-surface/40 px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:max-h-48"
                        >
                          <ul className="list-none divide-y divide-border/40">
                            {detailTags.map((t) => (
                              <li key={t.id} className="font-body py-2 text-sm text-text first:pt-1 last:pb-1">
                                <Link
                                  href={`/media/album-view?kind=generated&type=tag&id=${encodeURIComponent(t.id)}`}
                                  className="font-medium text-link underline-offset-2 transition-colors hover:text-link-hover hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                                  aria-label={`View all media tagged ${t.name}`}
                                >
                                  {t.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-2">
            <div role="tablist" aria-label="Media view" className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                role="tab"
                aria-selected={contentTab === "details"}
                variant="outline"
                size="sm"
                aria-label="Details"
                className={cn(
                  "h-9 w-9 gap-1.5 border-border p-0 sm:h-auto sm:w-auto sm:min-w-[6.5rem] sm:px-3 sm:py-2",
                  contentTab === "details" &&
                    "border-[#8b2e2e]/30 bg-surface-inset/35 text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] hover:bg-surface-inset/45 dark:border-[#c9a8a8]/35 dark:bg-surface-2 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:hover:bg-surface-inset/25",
                )}
                onClick={() => setContentTab("details")}
              >
                <FileText className="size-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Details</span>
              </Button>
              <Button
                type="button"
                role="tab"
                aria-selected={contentTab === "image"}
                variant="outline"
                size="sm"
                aria-label="Image"
                className={cn(
                  "h-9 w-9 gap-1.5 border-border p-0 sm:h-auto sm:w-auto sm:min-w-[6.5rem] sm:px-3 sm:py-2",
                  contentTab === "image" &&
                    "border-[#8b2e2e]/30 bg-surface-inset/35 text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] hover:bg-surface-inset/45 dark:border-[#c9a8a8]/35 dark:bg-surface-2 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:hover:bg-surface-inset/25",
                )}
                onClick={() => setContentTab("image")}
              >
                <ImageIcon className="size-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Image</span>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 border-border p-0 sm:h-auto sm:w-auto sm:min-w-[8rem] sm:px-3 sm:py-2"
                onClick={() => {
                  if (m) onShareCurrent(m);
                }}
                disabled={!canShare}
                aria-label="Share image"
              >
                <Share2 className="size-4" aria-hidden />
                <span className="hidden sm:inline">Share image</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 border-border p-0 sm:h-auto sm:w-auto sm:min-w-[8rem] sm:px-3 sm:py-2"
                onClick={() => {
                  if (m) onViewCurrent(m);
                }}
                disabled={!canShare}
                aria-label="View image page"
              >
                <ExternalLink className="size-4" aria-hidden />
                <span className="hidden sm:inline">View image</span>
              </Button>
            </div>
          </div>

          {(m?.linkedIndividuals?.length ?? 0) > 0 ? (
            <div className="mt-3 w-full shrink-0 border-t border-border/40 px-1 pt-3 text-left sm:px-0">
              <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b2e2e]">
                People Featured ({(m?.linkedIndividuals ?? []).length})
              </p>
              <p className="mt-2 font-body text-sm leading-relaxed text-text">
                {(m?.linkedIndividuals ?? []).map((p, i) => (
                  <span key={p.id} className="inline">
                    {i > 0 ? <span aria-hidden>, </span> : null}
                    <Link
                      href={`/media/album-view?kind=generated&type=individual&id=${encodeURIComponent(p.id)}`}
                      className="font-medium text-link underline-offset-2 transition-colors hover:text-link-hover hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    >
                      {p.displayName}
                    </Link>
                  </span>
                ))}
              </p>
            </div>
          ) : null}

          {canNav ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[7rem] flex-1 border-border sm:min-w-[8rem] sm:flex-none"
                onClick={handlePrev}
                disabled={index <= 0}
                aria-label="Previous image"
              >
                <ChevronLeft className="size-4" aria-hidden />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="size-10 shrink-0 border-border p-0 sm:size-9"
                onClick={() => setSlideshowPlaying((p) => !p)}
                aria-pressed={slideshowPlaying}
                aria-label={slideshowPlaying ? "Pause slideshow" : "Play slideshow"}
              >
                {slideshowPlaying ? (
                  <Pause className="size-4" aria-hidden />
                ) : (
                  <Play className="size-4" aria-hidden />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[7rem] flex-1 border-border sm:min-w-[8rem] sm:flex-none"
                onClick={handleNext}
                disabled={index >= total - 1}
                aria-label="Next image"
              >
                Next
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(shell, document.body);
}

export type PublicAlbumLayoutProps = {
  model: AlbumViewModel;
};

export function PublicAlbumLayout({
  model,
}: PublicAlbumLayoutProps) {
  const description = (model.description ?? "").trim();
  const addedLabel = formatAlbumDate(model.albumCreatedAt);

  const viewKey = useMemo(() => JSON.stringify(model.source), [model.source]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "media">("media");
  const [mediaLayout, setMediaLayout] = useState<"grid" | "list">("grid");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<PublicAlbumMediaTypeFilter>("all");
  const [personFilterIds, setPersonFilterIds] = useState<string[]>([]);
  const [placeFilterIds, setPlaceFilterIds] = useState<string[]>([]);
  const [tagFilterIds, setTagFilterIds] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<AlbumMediaDateRangeFilter>(EMPTY_DATE_RANGE);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [peopleSearchQuery, setPeopleSearchQuery] = useState("");
  const [placeSearchQuery, setPlaceSearchQuery] = useState("");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [draftMediaType, setDraftMediaType] = useState<PublicAlbumMediaTypeFilter>("all");
  const [draftPersonIds, setDraftPersonIds] = useState<string[]>([]);
  const [draftPlaceIds, setDraftPlaceIds] = useState<string[]>([]);
  const [draftTagIds, setDraftTagIds] = useState<string[]>([]);
  const [draftDateRange, setDraftDateRange] = useState<AlbumMediaDateRangeFilter>(EMPTY_DATE_RANGE);
  const [isNarrow, setIsNarrow] = useState(false);
  const filterWrapRef = useRef<HTMLDivElement>(null);
  const filterOpenPrevRef = useRef(false);
  const mediaSectionRef = useRef<HTMLElement>(null);
  const prevMediaPageRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)") : null;
    if (!mq) return;
    const fn = () => setIsNarrow(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    setPageIndex(0);
    setPageSize(DEFAULT_PAGE_SIZE);
    prevMediaPageRef.current = null;
    setActiveTab("media");
    setMediaTypeFilter("all");
    setPersonFilterIds([]);
    setPlaceFilterIds([]);
    setTagFilterIds([]);
    setDateRangeFilter(EMPTY_DATE_RANGE);
    setFilterMenuOpen(false);
    setPeopleSearchQuery("");
    setPlaceSearchQuery("");
    setTagSearchQuery("");
    setDraftMediaType("all");
    setDraftPersonIds([]);
    setDraftPlaceIds([]);
    setDraftTagIds([]);
    setDraftDateRange(EMPTY_DATE_RANGE);
  }, [viewKey]);

  const items = model.media;
  const totalAll = items.length;
  const linked = model.linkedIndividuals ?? [];
  const linkedPlacesCatalog = model.linkedPlaces ?? [];

  const linkedPlacesWithCounts = useMemo(
    () => buildPlacesWithCounts(items, linkedPlacesCatalog),
    [items, linkedPlacesCatalog],
  );
  const linkedTagsWithCounts = useMemo(() => buildTagsWithCounts(items), [items]);

  const mediaKindCounts = useMemo(() => {
    const counts: Record<PublicAlbumMediaKind, number> = {
      image: 0,
      video: 0,
      audio: 0,
      document: 0,
      other: 0,
    };
    for (const m of items) {
      counts[inferMediaBucketKind(m)] += 1;
    }
    return counts;
  }, [items]);

  useEffect(() => {
    const valid = new Set(linked.map((p) => p.id));
    setPersonFilterIds((ids) => ids.filter((id) => valid.has(id)));
  }, [linked]);

  useEffect(() => {
    const valid = new Set(linkedPlacesCatalog.map((p) => p.id));
    setPlaceFilterIds((ids) => ids.filter((id) => valid.has(id)));
  }, [linkedPlacesCatalog]);

  useEffect(() => {
    const valid = new Set(linkedTagsWithCounts.map((t) => t.id));
    setTagFilterIds((ids) => ids.filter((id) => valid.has(id)));
  }, [linkedTagsWithCounts]);

  useEffect(() => {
    if (mediaTypeFilter !== "all" && mediaKindCounts[mediaTypeFilter] === 0) {
      setMediaTypeFilter("all");
    }
  }, [mediaKindCounts, mediaTypeFilter]);

  useEffect(() => {
    if (!filterMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilterMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filterMenuOpen]);

  useEffect(() => {
    if (filterMenuOpen && !filterOpenPrevRef.current) {
      setDraftMediaType(mediaTypeFilter);
      setDraftPersonIds([...personFilterIds]);
      setDraftPlaceIds([...placeFilterIds]);
      setDraftTagIds([...tagFilterIds]);
      setDraftDateRange({ ...dateRangeFilter });
    }
    filterOpenPrevRef.current = filterMenuOpen;
  }, [
    filterMenuOpen,
    mediaTypeFilter,
    personFilterIds,
    placeFilterIds,
    tagFilterIds,
    dateRangeFilter,
  ]);

  useEffect(() => {
    if (!filterMenuOpen || isNarrow) return;
    const onDoc = (e: MouseEvent) => {
      const el = filterWrapRef.current;
      if (el && !el.contains(e.target as Node)) setFilterMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [filterMenuOpen, isNarrow]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (mediaTypeFilter !== "all") {
      list = list.filter((m) => inferMediaBucketKind(m) === mediaTypeFilter);
    }
    if (personFilterIds.length > 0) {
      const want = new Set(personFilterIds);
      list = list.filter((m) => (m.linkedIndividuals ?? []).some((p) => want.has(p.id)));
    }
    if (placeFilterIds.length > 0) {
      const want = new Set(placeFilterIds);
      list = list.filter((m) => (m.linkedPlaces ?? []).some((p) => want.has(p.id)));
    }
    if (tagFilterIds.length > 0) {
      const want = new Set(tagFilterIds);
      list = list.filter((m) => (m.linkedTags ?? []).some((t) => want.has(t.id)));
    }
    if (dateRangeFilterIsActive(dateRangeFilter)) {
      list = list.filter((m) => mediaMatchesDateRangeFilter(m, dateRangeFilter));
    }
    return list;
  }, [items, mediaTypeFilter, personFilterIds, placeFilterIds, tagFilterIds, dateRangeFilter]);

  const total = filteredItems.length;

  const filteredPeopleForPicker = useMemo(() => {
    const base = [...linked].sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
    );
    const q = peopleSearchQuery.trim();
    if (!q) return base;
    return base.filter((p) => matchesAlbumIndividualSearch(q, p));
  }, [linked, peopleSearchQuery]);

  const filteredPlacesForPicker = useMemo(() => {
    const base = [...linkedPlacesWithCounts];
    const q = placeSearchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((p) => formatAlbumLinkedPlaceLabel(p).toLowerCase().includes(q));
  }, [linkedPlacesWithCounts, placeSearchQuery]);

  const filteredTagsForPicker = useMemo(() => {
    const base = [...linkedTagsWithCounts];
    const q = tagSearchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((t) => t.name.toLowerCase().includes(q));
  }, [linkedTagsWithCounts, tagSearchQuery]);

  const filterButtonLabel = useMemo(
    () =>
      buildFilterButtonLabel(
        mediaTypeFilter,
        personFilterIds,
        placeFilterIds,
        tagFilterIds,
        dateRangeFilter,
        linked,
        linkedPlacesCatalog,
        linkedTagsWithCounts,
        totalAll,
        mediaKindCounts,
      ),
    [
      mediaTypeFilter,
      personFilterIds,
      placeFilterIds,
      tagFilterIds,
      dateRangeFilter,
      linked,
      linkedPlacesCatalog,
      linkedTagsWithCounts,
      totalAll,
      mediaKindCounts,
    ],
  );

  const editingFilters = filterMenuOpen;
  const panelMediaType = editingFilters ? draftMediaType : mediaTypeFilter;
  const panelSelectedPersonIds = editingFilters ? draftPersonIds : personFilterIds;
  const panelSelectedPlaceIds = editingFilters ? draftPlaceIds : placeFilterIds;
  const panelSelectedTagIds = editingFilters ? draftTagIds : tagFilterIds;
  const panelDateRange = editingFilters ? draftDateRange : dateRangeFilter;

  const toggleCommittedPerson = useCallback((id: string) => {
    setPersonFilterIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return [...s];
    });
  }, []);

  const toggleDraftPerson = useCallback((id: string) => {
    setDraftPersonIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return [...s];
    });
  }, []);

  const toggleCommittedPlace = useCallback((id: string) => {
    setPlaceFilterIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return [...s];
    });
  }, []);

  const toggleDraftPlace = useCallback((id: string) => {
    setDraftPlaceIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return [...s];
    });
  }, []);

  const toggleCommittedTag = useCallback((id: string) => {
    setTagFilterIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return [...s];
    });
  }, []);

  const toggleDraftTag = useCallback((id: string) => {
    setDraftTagIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return [...s];
    });
  }, []);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(pageIndex, totalPages - 1);

  const coverSrc = model.coverMedia ? rasterSrc(model.coverMedia) : null;
  const firstItemSrc = items[0] ? rasterSrc(items[0]) : null;
  const featuredSrc = coverSrc ?? firstItemSrc;

  useEffect(() => {
    setPageIndex((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    setPageIndex(0);
  }, [pageSize]);

  useEffect(() => {
    setPageIndex(0);
  }, [mediaTypeFilter, personFilterIds, placeFilterIds, tagFilterIds, dateRangeFilter]);

  const pageSlice = useMemo(() => {
    const start = safePage * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  const rangeStart = total === 0 ? 0 : safePage * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(total, (safePage + 1) * pageSize);
  const showPager = totalPages > 1;
  const showMediaControls = total > 0;

  const goPrev = useCallback(() => {
    setPageIndex((p) => Math.max(0, p - 1));
  }, []);
  const goNext = useCallback(() => {
    setPageIndex((p) => {
      const tp = Math.max(1, Math.ceil(total / pageSize));
      return Math.min(tp - 1, p + 1);
    });
  }, [total, pageSize]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const lightboxPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null || i <= 0 ? i : i - 1));
  }, []);
  const lightboxNext = useCallback(() => {
    setLightboxIndex((i) => (i === null || i >= filteredItems.length - 1 ? i : i + 1));
  }, [filteredItems.length]);

  const lightboxSlideshowAdvance = useCallback(() => {
    setLightboxIndex((i) => {
      if (i === null) return i;
      if (filteredItems.length <= 1) return i;
      return (i + 1) % filteredItems.length;
    });
  }, [filteredItems.length]);

  const openLightboxForId = useCallback(
    (id: string) => {
      const i = filteredItems.findIndex((x) => x.id === id);
      if (i >= 0) setLightboxIndex(i);
    },
    [filteredItems],
  );

  const shareAlbum = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: model.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled or clipboard blocked */
    }
  }, [model.title]);

  const shareMedia = useCallback(
    async (m: MediaSummary) => {
      if (typeof window === "undefined") return;
      const path = buildPublicMediaPath(model.source, m.id);
      const url = new URL(path, window.location.origin).toString();
      const mediaTitle = (m.title ?? "").trim() || "Shared image";
      try {
        if (navigator.share) {
          await navigator.share({ title: mediaTitle, url });
        } else {
          await navigator.clipboard.writeText(url);
        }
      } catch {
        /* user cancelled or clipboard blocked */
      }
    },
    [model.source],
  );

  const viewMediaPage = useCallback(
    (m: MediaSummary) => {
      if (typeof window === "undefined") return;
      const path = buildPublicMediaPath(model.source, m.id);
      window.location.href = path;
    },
    [model.source],
  );

  useEffect(() => {
    if (!showPager) {
      prevMediaPageRef.current = safePage;
      return;
    }
    if (prevMediaPageRef.current !== null && prevMediaPageRef.current !== safePage) {
      mediaSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevMediaPageRef.current = safePage;
  }, [safePage, showPager]);

  const lightboxOpen =
    lightboxIndex !== null && lightboxIndex >= 0 && lightboxIndex < filteredItems.length;

  const isCurated = model.kind === "curated";

  return (
    <div className="relative min-h-screen min-w-0 w-full max-w-full bg-bg font-body text-text">
      {/* Subtle paper grain — same asset as HeroAndMenu, barely visible */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.045] mix-blend-multiply dark:opacity-[0.03] dark:mix-blend-soft-light"
        aria-hidden
        style={{
          backgroundImage: "url(/images/agedpaperbg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative z-10 min-h-screen min-w-0 w-full max-w-full">
      {/* Hero — same visual language as HeroAndMenu + homepage typography tokens */}
      <section className="relative isolate min-h-[min(88vw,380px)] w-full overflow-hidden bg-bg md:min-h-[400px]">
        {featuredSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuredSrc}
              alt=""
              className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
              aria-hidden
            />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-surface-2 via-surface to-bg"
            aria-hidden
          />
        )}
        <div
          className="absolute inset-0 bg-bg/42 dark:bg-bg/42 backdrop-blur-md md:backdrop-blur-sm"
          aria-hidden
        />
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 50%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 45%, transparent 72%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-bg via-bg/[0.88] to-transparent"
          aria-hidden
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-10 pt-14 md:px-8 md:pb-12 md:pt-32">
          <div className="grid items-end gap-8 pt-6 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-12 lg:pt-2">
            <div className="mx-auto w-full max-w-[220px] sm:max-w-[260px] lg:mx-0 lg:max-w-none">
              <div className="relative">
                <div
                  className="rounded-2xl border-[10px] border-surface-elevated bg-surface-elevated p-1 md:border-[12px] md:rounded-[1.35rem]"
                  style={{
                    boxShadow:
                      "0 10px 32px rgba(0,0,0,0.11), 0 2px 8px rgba(60,45,25,0.06), inset 0 0 0 1px rgba(255,255,255,0.32)",
                  }}
                >
                  {featuredSrc ? (
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-surface-inset/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={featuredSrc}
                        alt=""
                        className="size-full object-cover object-center"
                        fetchPriority="high"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-surface-2 text-sm text-muted">
                      No image
                    </div>
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-full border-2 border-border bg-surface-elevated shadow-md md:size-11"
                  aria-hidden
                >
                  <ImageIcon size={20} className="shrink-0 text-primary" />
                </div>
              </div>
            </div>

            <div className="min-w-0 space-y-4 pb-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                {isCurated ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 font-body text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#9C5A4A] dark:text-[#C49184]">
                      <Globe size={14} className="shrink-0 opacity-90" aria-hidden />
                      Public album
                    </span>
                    <span className="text-subtle opacity-70" aria-hidden>
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-body text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#9C5A4A] dark:text-[#C49184]">
                      <Users size={14} className="shrink-0 opacity-90" aria-hidden />
                      Shared
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    <Globe size={14} className="shrink-0" aria-hidden />
                    From your tree
                  </span>
                )}
              </div>
              <h1 className="font-heading text-balance text-[1.95rem] font-semibold leading-[1.05] tracking-tight text-heading sm:text-[2.1rem] md:text-[2.35rem] lg:text-[2.65rem] lg:leading-[1.04]">
                {model.title}
              </h1>
              {description ? (
                <p className="max-w-2xl font-body text-base leading-relaxed text-text md:text-lg md:leading-relaxed">
                  {description}
                </p>
              ) : (
                <p className="max-w-2xl font-body text-sm italic text-muted">No description yet.</p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2 font-body text-sm text-muted">
                <span className="inline-flex items-center gap-2">
                  <ImageIcon size={18} className="shrink-0 text-primary/85" aria-hidden />
                  <span className="tabular-nums font-medium text-text">
                    {model.totalCount} item{model.totalCount === 1 ? "" : "s"}
                  </span>
                </span>
                {addedLabel ? (
                  <span className="inline-flex items-center gap-2">
                    <Calendar size={18} className="shrink-0 text-primary/85" aria-hidden />
                    <span>
                      Added <span className="font-medium text-text">{addedLabel}</span>
                    </span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab + share bar — Pillars strip tone from homepage-test */}
      <div
        className="relative z-10 w-full border-b border-border-subtle"
        style={{
          backgroundColor: "rgba(221, 201, 170, 0.45)",
          boxShadow:
            "0 -8px 40px rgba(0,0,0,0.04), 0 14px 48px -4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.35)",
        }}
      >
        <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-nowrap items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-5 sm:py-3 md:px-8">
          <div
            className="flex min-w-0 flex-nowrap items-center gap-1 sm:gap-6"
            role="tablist"
            aria-label="Album sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "media"}
              aria-label={`Media, ${model.totalCount} items`}
              className={`inline-flex h-9 w-9 flex-none flex-nowrap items-center justify-center gap-1.5 border-b-[3px] border-solid p-0 font-body text-xs font-medium uppercase tracking-[0.12em] transition-colors sm:h-auto sm:min-h-10 sm:w-auto sm:justify-start sm:gap-2 sm:px-1 sm:py-2 ${
                activeTab === "media"
                  ? "border-b-[#8b2e2e] text-heading"
                  : "border-b-transparent text-muted hover:text-text"
              }`}
              onClick={() => setActiveTab("media")}
            >
              <LayoutGrid size={16} className="shrink-0" aria-hidden />
              <span className="hidden sm:inline">Media ({model.totalCount})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "about"}
              aria-label="About this album"
              className={`inline-flex h-9 w-9 flex-none flex-nowrap items-center justify-center gap-1.5 border-b-[3px] border-solid p-0 font-body text-xs font-medium uppercase tracking-[0.12em] transition-colors sm:h-auto sm:min-h-10 sm:w-auto sm:justify-start sm:gap-2 sm:px-1 sm:py-2 ${
                activeTab === "about"
                  ? "border-b-[#8b2e2e] text-heading"
                  : "border-b-transparent text-muted hover:text-text"
              }`}
              onClick={() => setActiveTab("about")}
            >
              <Leaf size={16} className="shrink-0" aria-hidden />
              <span className="hidden sm:inline">About</span>
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            aria-label="Share album"
            className="h-9 w-9 flex-none flex-nowrap rounded-full border border-border/80 bg-black/[0.035] p-0 font-body text-sm font-medium text-heading shadow-none backdrop-blur-[2px] hover:bg-black/[0.06] hover:text-heading focus-visible:ring-2 focus-visible:ring-focus-ring sm:h-9 sm:w-auto sm:rounded-lg sm:gap-2 sm:px-4 sm:py-2"
            onClick={() => void shareAlbum()}
          >
            <Share2 size={16} className="shrink-0" aria-hidden />
            <span className="hidden sm:inline">Share album</span>
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-12">
        {activeTab === "media" ? (
          <section ref={mediaSectionRef} className="scroll-mt-6 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="inline-flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight text-heading md:text-3xl">
                  <Leaf size={22} strokeWidth={2.25} className="shrink-0 text-primary/75" aria-hidden />
                  Media
                </h2>
                <p className="font-body mt-1 text-xs text-muted/70 md:text-sm md:text-muted/75">
                  {total} item{total === 1 ? "" : "s"}
                  {totalAll !== total ? (
                    <span className="text-muted">
                      {" "}
                      (of {totalAll} total)
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/40 bg-black/[0.03] p-1.5">
                <div className="relative min-w-0" ref={filterWrapRef}>
                  <Button
                    type="button"
                    variant="outline"
                    aria-haspopup="dialog"
                    aria-expanded={filterMenuOpen}
                    onClick={() => setFilterMenuOpen((prev) => !prev)}
                    className="h-auto min-h-9 max-w-[min(100%,18rem)] flex-none flex-nowrap gap-2 border-border/60 bg-surface/70 px-2.5 py-1.5 text-left font-body text-sm font-normal text-text shadow-none hover:bg-surface-2/90"
                  >
                    <Filter size={16} className="shrink-0 text-muted" aria-hidden />
                    <span className="min-w-0 truncate">{filterButtonLabel}</span>
                  </Button>
                  {filterMenuOpen && !isNarrow ? (
                    <div
                      className="absolute right-0 top-full z-50 mt-2 w-[min(42rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]"
                      role="dialog"
                      aria-label="Filter media"
                    >
                      <AlbumMediaFilterPanel
                        panelMediaType={panelMediaType}
                        panelSelectedPersonIds={panelSelectedPersonIds}
                        panelSelectedPlaceIds={panelSelectedPlaceIds}
                        panelSelectedTagIds={panelSelectedTagIds}
                        panelDateRange={panelDateRange}
                        mediaKindCounts={mediaKindCounts}
                        totalAll={totalAll}
                        linked={linked}
                        filteredPeople={filteredPeopleForPicker}
                        linkedPlaces={linkedPlacesWithCounts}
                        filteredPlaces={filteredPlacesForPicker}
                        linkedTags={linkedTagsWithCounts}
                        filteredTags={filteredTagsForPicker}
                        peopleSearchQuery={peopleSearchQuery}
                        onPeopleSearchQueryChange={setPeopleSearchQuery}
                        placeSearchQuery={placeSearchQuery}
                        onPlaceSearchQueryChange={setPlaceSearchQuery}
                        tagSearchQuery={tagSearchQuery}
                        onTagSearchQueryChange={setTagSearchQuery}
                        onPickType={(t) => setDraftMediaType(t)}
                        onTogglePerson={toggleDraftPerson}
                        onTogglePlace={toggleDraftPlace}
                        onToggleTag={toggleDraftTag}
                        onDateRangeChange={setDraftDateRange}
                        onClearFilters={() => {
                          setMediaTypeFilter("all");
                          setPersonFilterIds([]);
                          setPlaceFilterIds([]);
                          setTagFilterIds([]);
                          setDateRangeFilter(EMPTY_DATE_RANGE);
                          setDraftMediaType("all");
                          setDraftPersonIds([]);
                          setDraftPlaceIds([]);
                          setDraftTagIds([]);
                          setDraftDateRange(EMPTY_DATE_RANGE);
                          setPeopleSearchQuery("");
                          setPlaceSearchQuery("");
                          setTagSearchQuery("");
                        }}
                        onApplyFilter={() => {
                          setMediaTypeFilter(draftMediaType);
                          setPersonFilterIds([...draftPersonIds]);
                          setPlaceFilterIds([...draftPlaceIds]);
                          setTagFilterIds([...draftTagIds]);
                          setDateRangeFilter({ ...draftDateRange });
                          setFilterMenuOpen(false);
                        }}
                        onClose={() => setFilterMenuOpen(false)}
                      />
                    </div>
                  ) : null}
                </div>
                <div
                  className="inline-flex rounded-lg border border-border/50 bg-surface/50 p-0.5 shadow-none"
                  role="group"
                  aria-label="View layout"
                >
                  <button
                    type="button"
                    aria-pressed={mediaLayout === "grid"}
                    className={`inline-flex items-center justify-center rounded-md p-2 transition-colors ${
                      mediaLayout === "grid"
                        ? "bg-heading/[0.09] text-heading ring-1 ring-border/35"
                        : "text-muted hover:bg-surface-2/80 hover:text-text"
                    }`}
                    onClick={() => setMediaLayout("grid")}
                    aria-label="Grid view"
                  >
                    <LayoutGrid size={18} className="shrink-0" />
                  </button>
                  <button
                    type="button"
                    aria-pressed={mediaLayout === "list"}
                    className={`inline-flex items-center justify-center rounded-md p-2 transition-colors ${
                      mediaLayout === "list"
                        ? "bg-heading/[0.09] text-heading ring-1 ring-border/35"
                        : "text-muted hover:bg-surface-2/80 hover:text-text"
                    }`}
                    onClick={() => setMediaLayout("list")}
                    aria-label="List view"
                  >
                    <List size={18} className="shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            {personFilterIds.length > 0 ||
            placeFilterIds.length > 0 ||
            tagFilterIds.length > 0 ||
            dateRangeFilterIsActive(dateRangeFilter) ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {personFilterIds.map((id) => {
                  const p = linked.find((x) => x.id === id);
                  if (!p) return null;
                  return (
                    <span
                      key={`p-${id}`}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#ddd5c8] bg-[#f7f3eb] px-3 py-1.5 font-body text-xs text-heading shadow-sm"
                    >
                      <span className="min-w-0 truncate font-medium">{p.displayName}</span>
                      <button
                        type="button"
                        className="shrink-0 rounded-full p-0.5 text-muted transition-colors hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        onClick={() => toggleCommittedPerson(id)}
                        aria-label={`Remove ${p.displayName} from filter`}
                      >
                        <X size={14} className="shrink-0" aria-hidden />
                      </button>
                    </span>
                  );
                })}
                {placeFilterIds.map((id) => {
                  const p = linkedPlacesCatalog.find((x) => x.id === id);
                  if (!p) return null;
                  const lab = formatAlbumLinkedPlaceLabel(p);
                  return (
                    <span
                      key={`pl-${id}`}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#ddd5c8] bg-[#f7f3eb] px-3 py-1.5 font-body text-xs text-heading shadow-sm"
                    >
                      <span className="min-w-0 truncate font-medium">{lab}</span>
                      <button
                        type="button"
                        className="shrink-0 rounded-full p-0.5 text-muted transition-colors hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        onClick={() => toggleCommittedPlace(id)}
                        aria-label={`Remove ${lab} from filter`}
                      >
                        <X size={14} className="shrink-0" aria-hidden />
                      </button>
                    </span>
                  );
                })}
                {tagFilterIds.map((id) => {
                  const t = linkedTagsWithCounts.find((x) => x.id === id);
                  if (!t) return null;
                  return (
                    <span
                      key={`t-${id}`}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#ddd5c8] bg-[#f7f3eb] px-3 py-1.5 font-body text-xs text-heading/90 shadow-sm"
                    >
                      <span className="min-w-0 truncate font-medium">{t.name}</span>
                      <button
                        type="button"
                        className="shrink-0 rounded-full p-0.5 text-muted transition-colors hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        onClick={() => toggleCommittedTag(id)}
                        aria-label={`Remove tag ${t.name}`}
                      >
                        <X size={14} className="shrink-0" aria-hidden />
                      </button>
                    </span>
                  );
                })}
                {dateRangeFilterIsActive(dateRangeFilter) ? (
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#ddd5c8] bg-[#f7f3eb] px-3 py-1.5 font-body text-xs text-heading shadow-sm">
                    <span className="min-w-0 truncate font-medium">{summarizeDateRangeFilter(dateRangeFilter)}</span>
                    <button
                      type="button"
                      className="shrink-0 rounded-full p-0.5 text-muted transition-colors hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      onClick={() => setDateRangeFilter(EMPTY_DATE_RANGE)}
                      aria-label="Remove date filter"
                    >
                      <X size={14} className="shrink-0" aria-hidden />
                    </button>
                  </span>
                ) : null}
              </div>
            ) : null}

            {total === 0 ? (
              <p className="font-body text-sm text-muted">
                {totalAll === 0
                  ? "No media in this view."
                  : mediaTypeFilter !== "all" ||
                      personFilterIds.length > 0 ||
                      placeFilterIds.length > 0 ||
                      tagFilterIds.length > 0 ||
                      dateRangeFilterIsActive(dateRangeFilter)
                    ? "No media matches this filter."
                    : "No items match this filter. Choose another type or All types."}
              </p>
            ) : (
              <>
                <p className="font-body mt-2 text-xs leading-snug text-muted sm:text-sm">
                  Click or tap a thumbnail for a full-size view.
                </p>
                {mediaLayout === "grid" ? (
                  <div className="relative mt-2 overflow-hidden rounded-lg ring-1 ring-border/25" aria-label="Media grid">
                    <div
                      className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-[#A67C52]/[0.06] via-transparent to-[#5C4A38]/[0.04]"
                      aria-hidden
                    />
                    <div className="relative z-[2] grid grid-cols-3 gap-2 sm:gap-2.5 md:gap-3">
                      {pageSlice.map((m) => (
                        <MediaTile key={m.id} m={m} onOpen={() => openLightboxForId(m.id)} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col gap-2.5" aria-label="Media list">
                    {pageSlice.map((m) => (
                      <MediaListRow key={m.id} m={m} onOpen={() => openLightboxForId(m.id)} />
                    ))}
                  </div>
                )}
                {showMediaControls ? (
                  <div
                    className="flex flex-col gap-3 rounded-xl border border-border bg-surface-elevated/90 px-3 py-3 sm:px-4"
                    role="navigation"
                    aria-label="Media pages"
                  >
                    <p className="font-body text-center text-sm text-muted sm:text-left">
                      Showing{" "}
                      <span className="font-medium tabular-nums text-text">
                        {rangeStart}–{rangeEnd}
                      </span>{" "}
                      of <span className="font-medium tabular-nums text-text">{total}</span>
                      {showPager ? (
                        <span className="whitespace-nowrap">
                          {" "}
                          · Page{" "}
                          <span className="font-medium tabular-nums text-text">{safePage + 1}</span> of{" "}
                          <span className="font-medium tabular-nums text-text">{totalPages}</span>
                        </span>
                      ) : null}
                    </p>
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <label className="font-body flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 text-sm text-muted sm:w-auto sm:justify-start">
                        <span className="shrink-0 whitespace-nowrap">Per page</span>
                        <select
                          className="h-8 min-w-[5.5rem] max-w-full cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1 text-sm font-medium tabular-nums text-text outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                          value={pageSize}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (PAGE_SIZE_OPTIONS.includes(v as PageSizeOption)) {
                              setPageSize(v as PageSizeOption);
                            }
                          }}
                          aria-label="Items per page"
                        >
                          {PAGE_SIZE_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex items-center justify-center gap-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={goPrev}
                          disabled={!showPager || safePage <= 0}
                          aria-label="Previous page of media"
                          className="min-w-[7.5rem] border-border"
                        >
                          <ChevronLeft className="size-3.5" aria-hidden />
                          Previous
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={goNext}
                          disabled={!showPager || safePage >= totalPages - 1}
                          aria-label="Next page of media"
                          className="min-w-[7.5rem] border-border"
                        >
                          Next
                          <ChevronRight className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : (
          <div
            className="rounded-2xl border border-border-subtle bg-surface-elevated/90 p-6 md:p-10"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.45) 0%, transparent 42%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.28) 0%, transparent 50%), linear-gradient(180deg, var(--surface-elevated) 0%, rgba(251,247,238,0.97) 100%)",
              boxShadow: "0 12px 48px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,14rem)] lg:gap-10">
              <div className="min-w-0 space-y-8">
                <div className="space-y-4">
                  <p className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-[#8b2e2e] md:text-base">
                    About this album
                  </p>
                  <p className="font-body whitespace-pre-wrap text-base leading-relaxed text-text md:text-[1.05rem]">
                    {description || "No description has been added for this album yet."}
                  </p>
                </div>
                {(model.linkedIndividuals?.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    <p className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-[#8b2e2e] md:text-base">
                      People Featured ({(model.linkedIndividuals ?? []).length})
                    </p>
                    <p className="font-body text-sm leading-relaxed text-muted">
                      The people who appear in these moments. Follow a name to explore their story through images and
                      media.
                    </p>
                    <div
                      role="region"
                      aria-label={`People featured (${(model.linkedIndividuals ?? []).length})`}
                      className="max-h-52 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-lg border border-border/50 bg-surface/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:max-h-60 md:max-h-64"
                    >
                      <ul className="list-none divide-y divide-border/40 px-3 py-1">
                        {model.linkedIndividuals!.map((p) => (
                          <li
                            key={p.id}
                            className="font-body flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2.5 text-sm text-text first:pt-2 last:pb-2"
                          >
                            <Link
                              href={`/media/album-view?kind=generated&type=individual&id=${encodeURIComponent(p.id)}`}
                              className="min-w-0 max-w-full truncate font-medium text-link underline-offset-2 transition-colors hover:text-link-hover hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                              aria-label={`View all media for ${p.displayName}`}
                            >
                              {p.displayName}
                            </Link>
                            <span className="shrink-0 font-mono text-[11px] text-muted tabular-nums">{p.xref}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : model.media.length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-[#8b2e2e] md:text-base">
                      People Featured (0)
                    </p>
                    <p className="font-body text-sm leading-relaxed text-muted">
                      No individual links were found for these files in the tree (they may only be attached to
                      places, sources, or other record types).
                    </p>
                  </div>
                ) : null}

                {(model.linkedPlaces?.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    <p className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-[#8b2e2e] md:text-base">
                      Places ({(model.linkedPlaces ?? []).length})
                    </p>
                    <div
                      role="region"
                      aria-label={`Places (${(model.linkedPlaces ?? []).length})`}
                      className="max-h-52 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-lg border border-border/50 bg-surface/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:max-h-60 md:max-h-64"
                    >
                      <ul className="list-none divide-y divide-border/40 px-3 py-1">
                        {model.linkedPlaces!.map((p) => (
                          <li
                            key={p.id}
                            className="font-body flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2.5 text-sm text-text first:pt-2 last:pb-2"
                          >
                            <Link
                              href={`/media/album-view?kind=generated&type=place&id=${encodeURIComponent(p.id)}`}
                              className="min-w-0 max-w-full truncate font-medium text-link underline-offset-2 transition-colors hover:text-link-hover hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                              aria-label={`View all media for ${formatAboutPlaceLabel(p)}`}
                            >
                              {formatAboutPlaceLabel(p)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {(model.linkedDates?.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    <p className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-[#8b2e2e] md:text-base">
                      Dates ({(model.linkedDates ?? []).length})
                    </p>
                    <div
                      role="region"
                      aria-label={`Dates (${(model.linkedDates ?? []).length})`}
                      className="max-h-52 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-lg border border-border/50 bg-surface/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:max-h-60 md:max-h-64"
                    >
                      <ul className="list-none divide-y divide-border/40 px-3 py-1">
                        {model.linkedDates!.map((d) => (
                          <li
                            key={d.id}
                            className="font-body flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2.5 text-sm text-text first:pt-2 last:pb-2"
                          >
                            <Link
                              href={`/media/album-view?kind=generated&type=date&id=${encodeURIComponent(d.id)}`}
                              className="min-w-0 max-w-full truncate font-medium text-link underline-offset-2 transition-colors hover:text-link-hover hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                              aria-label={`View all media for ${formatGedcomDateDisplayLabel(d)}`}
                            >
                              {formatGedcomDateDisplayLabel(d)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col items-center justify-center gap-3 border-t border-border/50 pt-8 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
                <TreePine
                  size={100}
                  strokeWidth={1}
                  className="shrink-0 text-primary/20"
                  aria-hidden
                />
                <p className="max-w-[14rem] text-center font-heading text-lg italic leading-snug text-primary md:text-right lg:text-left">
                  Preserving memories. Honoring legacy.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {filterMenuOpen && isNarrow && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[150] font-body">
              <button
                type="button"
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                aria-label="Dismiss filter"
                onClick={() => setFilterMenuOpen(false)}
              />
              <div
                className="album-filter-sheet-enter absolute bottom-0 left-0 right-0 flex max-h-[min(88dvh,720px)] min-h-0 flex-col overflow-hidden rounded-t-2xl border border-[#e8e0d4] bg-[#f5f1ea] shadow-[0_-12px_48px_rgba(0,0,0,0.14)]"
                role="dialog"
                aria-label="Filter media"
              >
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <AlbumMediaFilterPanel
                    variant="mobile-sheet"
                    panelMediaType={panelMediaType}
                    panelSelectedPersonIds={panelSelectedPersonIds}
                    panelSelectedPlaceIds={panelSelectedPlaceIds}
                    panelSelectedTagIds={panelSelectedTagIds}
                    panelDateRange={panelDateRange}
                    mediaKindCounts={mediaKindCounts}
                    totalAll={totalAll}
                    linked={linked}
                    filteredPeople={filteredPeopleForPicker}
                    linkedPlaces={linkedPlacesWithCounts}
                    filteredPlaces={filteredPlacesForPicker}
                    linkedTags={linkedTagsWithCounts}
                    filteredTags={filteredTagsForPicker}
                    peopleSearchQuery={peopleSearchQuery}
                    onPeopleSearchQueryChange={setPeopleSearchQuery}
                    placeSearchQuery={placeSearchQuery}
                    onPlaceSearchQueryChange={setPlaceSearchQuery}
                    tagSearchQuery={tagSearchQuery}
                    onTagSearchQueryChange={setTagSearchQuery}
                    onPickType={(t) => setDraftMediaType(t)}
                    onTogglePerson={toggleDraftPerson}
                    onTogglePlace={toggleDraftPlace}
                    onToggleTag={toggleDraftTag}
                    onDateRangeChange={setDraftDateRange}
                    onClearFilters={() => {
                      setDraftMediaType("all");
                      setDraftPersonIds([]);
                      setDraftPlaceIds([]);
                      setDraftTagIds([]);
                      setDraftDateRange(EMPTY_DATE_RANGE);
                      setPeopleSearchQuery("");
                      setPlaceSearchQuery("");
                      setTagSearchQuery("");
                    }}
                    onApplyFilter={() => {
                      setMediaTypeFilter(draftMediaType);
                      setPersonFilterIds([...draftPersonIds]);
                      setPlaceFilterIds([...draftPlaceIds]);
                      setTagFilterIds([...draftTagIds]);
                      setDateRangeFilter({ ...draftDateRange });
                      setFilterMenuOpen(false);
                    }}
                    onClose={() => setFilterMenuOpen(false)}
                  />
                </div>
                <div className="shrink-0 border-t border-[#ebe4d9] bg-[#f7f3eb] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-8px_rgba(55,40,28,0.08)]">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 min-h-[48px] flex-1 border-[#d8cfc0] bg-[#faf8f4] font-body text-sm shadow-none"
                      onClick={() => {
                        setDraftMediaType("all");
                        setDraftPersonIds([]);
                        setDraftPlaceIds([]);
                        setDraftTagIds([]);
                        setDraftDateRange(EMPTY_DATE_RANGE);
                        setPeopleSearchQuery("");
                        setPlaceSearchQuery("");
                        setTagSearchQuery("");
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      className="h-12 min-h-[48px] flex-1 border-0 bg-[#8b2e2e] font-body text-sm text-white shadow-none hover:bg-[#7a2828]"
                      onClick={() => {
                        setMediaTypeFilter(draftMediaType);
                        setPersonFilterIds([...draftPersonIds]);
                        setPlaceFilterIds([...draftPlaceIds]);
                        setTagFilterIds([...draftTagIds]);
                        setDateRangeFilter({ ...draftDateRange });
                        setFilterMenuOpen(false);
                      }}
                    >
                      Apply filter
                    </Button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {lightboxOpen ? (
        <PublicAlbumLightbox
          items={filteredItems}
          index={lightboxIndex!}
          onClose={closeLightbox}
          onPrev={lightboxPrev}
          onNext={lightboxNext}
          onSlideshowAdvance={lightboxSlideshowAdvance}
          onShareCurrent={(m) => void shareMedia(m)}
          onViewCurrent={viewMediaPage}
        />
      ) : null}
      </div>
    </div>
  );
}
