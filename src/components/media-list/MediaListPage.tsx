"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { ListPageFilterSheet, ListPageMobileControls } from "@/components/list-page";
import { PublicAlbumLightbox } from "@/components/album/PublicAlbumLayout";
import { Footer } from "@/components/homepage";
import { redirectToLoginWall } from "@/lib/auth/client-auth-required";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import {
  buildMediaFilterButtonLabel,
  MediaActiveFilterChips,
  MediaFilterPanel,
} from "./MediaFilterPanel";
import { MediaCard } from "./MediaCard";
import { MediaPlayerModal } from "./MediaPlayerModal";
import {
  EMPTY_MEDIA_FILTERS,
  MEDIA_BUCKET_CONFIG,
  type MediaBucket,
  type MediaFilterState,
  type MediaListItem,
} from "./types";

type SortMode = "newest" | "oldest" | "az" | "za";

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "File name A-Z" },
  { value: "za", label: "File name Z-A" },
];

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function matchesLinkFilter(item: MediaListItem, filter: MediaFilterState["linkedTo"]): boolean {
  if (filter === "all") return true;
  if (filter === "unlinked") return item.linkedTo.length === 0;
  return item.linkedTo.some((link) => link.kind === filter);
}

export function MediaListPage({ items, bucket }: { items: MediaListItem[]; bucket: MediaBucket }) {
  const config = MEDIA_BUCKET_CONFIG[bucket];
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<MediaFilterState>(EMPTY_MEDIA_FILTERS);
  const [draftFilters, setDraftFilters] = useState<MediaFilterState>(EMPTY_MEDIA_FILTERS);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [page, setPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [playerItem, setPlayerItem] = useState<MediaListItem | null>(null);

  useEffect(() => {
    const mq = typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)") : null;
    if (!mq) return;
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const byFilters = items.filter((item) => {
      if (q) {
        const haystack = [
          item.filename,
          item.title ?? "",
          item.description ?? "",
          ...item.linkedTo.map((link) => link.label),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (!matchesLinkFilter(item, filters.linkedTo)) return false;
      if (filters.hasDescription === "yes" && !item.description) return false;
      if (filters.hasDescription === "no" && item.description) return false;
      return true;
    });

    const sorted = [...byFilters];
    sorted.sort((a, b) => {
      if (sortMode === "az") return a.filename.localeCompare(b.filename);
      if (sortMode === "za") return b.filename.localeCompare(a.filename);
      if (sortMode === "oldest") return a.createdAt.localeCompare(b.createdAt);
      return b.createdAt.localeCompare(a.createdAt);
    });
    return sorted;
  }, [items, searchQuery, filters, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => paginate(filtered, safePage, PAGE_SIZE), [filtered, safePage]);

  const pageNumbers = useMemo(() => {
    const visibleCount = isNarrow ? 3 : 5;
    const halfWindow = Math.floor(visibleCount / 2);
    const start = Math.max(1, Math.min(safePage - halfWindow, totalPages - visibleCount + 1));
    const end = Math.min(totalPages, start + visibleCount - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [isNarrow, safePage, totalPages]);

  // Image lightbox navigates over unrestricted items in the filtered list.
  const lightboxItems = useMemo(
    () => filtered.filter((item) => !item.privacyRestricted).map((p) => p.media),
    [filtered],
  );
  const lightboxOpen =
    lightboxIndex !== null && lightboxIndex >= 0 && lightboxIndex < lightboxItems.length;

  const openLightboxForId = useCallback(
    (id: string) => {
      const item = filtered.find((p) => p.id === id);
      if (!item || item.privacyRestricted) return;
      const i = lightboxItems.findIndex((m) => m.id === id);
      if (i >= 0) setLightboxIndex(i);
    },
    [filtered, lightboxItems],
  );
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const lightboxPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null || i <= 0 ? i : i - 1));
  }, []);
  const lightboxNext = useCallback(() => {
    setLightboxIndex((i) => (i === null || i >= lightboxItems.length - 1 ? i : i + 1));
  }, [lightboxItems.length]);
  const lightboxSlideshowAdvance = useCallback(() => {
    setLightboxIndex((i) => {
      if (i === null) return i;
      return i >= lightboxItems.length - 1 ? 0 : i + 1;
    });
  }, [lightboxItems.length]);

  const mainPhotosMediaPath = (mediaId: string) =>
    `/media/${encodeURIComponent(mediaId)}?kind=mainPhotos`;
  const shareCurrent = useCallback(async (m: { id: string; title: string | null }) => {
    if (typeof window === "undefined") return;
    const url = new URL(mainPhotosMediaPath(m.id), window.location.origin).toString();
    const title = (m.title ?? "").trim() || "Shared photo";
    try {
      if (navigator.share) await navigator.share({ title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* user cancelled or clipboard blocked */
    }
  }, []);
  const viewCurrent = useCallback(
    (m: { id: string }) => {
      router.push(mainPhotosMediaPath(m.id));
    },
    [router],
  );

  const handleOpen = useCallback(
    (item: MediaListItem) => {
      if (item.privacyRestricted && item.loginHref) {
        redirectToLoginWall(item.loginHref);
        return;
      }
      if (item.bucket === "image") {
        openLightboxForId(item.id);
        return;
      }
      if (item.bucket === "document") {
        if (typeof window !== "undefined") {
          window.open(item.fileUrl, "_blank", "noopener,noreferrer");
        }
        return;
      }
      setPlayerItem(item);
    },
    [openLightboxForId],
  );

  const openFilters = () => {
    setDraftFilters(filters);
    setFilterMenuOpen(true);
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_MEDIA_FILTERS);
    setFilters(EMPTY_MEDIA_FILTERS);
    setPage(1);
  };

  const applyDraftFilters = () => {
    setFilters(draftFilters);
    setFilterMenuOpen(false);
    setPage(1);
  };

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg pb-32 text-text sm:pb-0">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section noPadding className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image src="/images/albumsCoverImageMobile.png" alt="" fill priority className="object-cover md:hidden" sizes="100vw" />
            <Image src="/images/albumsCoverImage.png" alt="" fill priority className="hidden object-cover md:block" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/96 via-bg/82 to-bg/35 md:from-bg/92 md:via-bg/78 md:to-bg/20" />
            <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-bg to-transparent" />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <div className="grid min-w-0 max-w-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-10">
                <div className="min-w-0 max-w-full space-y-5 p-5 backdrop-blur-md [-webkit-backdrop-filter:blur(14px)] [backdrop-filter:blur(14px)] sm:p-6">
                  <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 text-xs tracking-[0.06em] text-muted">
                    <Link href="/" className="min-w-0 shrink transition hover:text-link">
                      Home
                    </Link>
                    <span className="shrink-0 text-subtle">/</span>
                    <span className="min-w-0 shrink text-muted">Archive</span>
                    <span className="shrink-0 text-subtle">/</span>
                    <span className="min-w-0 text-heading">{config.title}</span>
                  </nav>

                  <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                    {config.title}
                  </h1>

                  <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                  <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                    {config.description}
                  </p>
                </div>

                <div className="relative hidden min-h-[280px] overflow-hidden rounded-2xl border border-white/15 bg-black/10 shadow-[0_20px_50px_rgba(25,18,12,0.35)] lg:block">
                  <Image src="/images/albumsCoverImage.png" alt="" fill className="object-cover opacity-90 sepia-[0.25]" sizes="40vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-bg/10" />
                  <div className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-bg/65 to-transparent" />
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>

        <Section noPadding className="min-w-0 overflow-x-hidden pb-6 pt-2 sm:py-8 md:py-10">
          <PageContainer narrow>
            <div className="min-w-0 max-w-full space-y-5">
              <div className="min-w-0 max-w-full rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-[0_10px_26px_rgba(60,45,25,0.06)] sm:p-5">
                <div className="grid min-w-0 max-w-full gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
                  <p className="text-sm font-semibold text-heading">{filtered.length} {config.entityName}</p>

                  <label className="relative hidden min-w-0 sm:block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder={`Search ${config.noun}...`}
                      className="w-full rounded-xl border border-border-subtle bg-surface px-9 py-2.5 text-sm text-heading shadow-inner outline-none transition placeholder:text-muted/70 focus:border-link/50 focus:ring-2 focus:ring-link/15"
                    />
                  </label>

                  <div className="hidden flex-wrap items-center gap-2 rounded-xl border border-border/40 bg-black/[0.03] p-1.5 sm:flex">
                    <div className="relative min-w-0">
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        aria-expanded={filterMenuOpen}
                        onClick={() => {
                          if (filterMenuOpen) setFilterMenuOpen(false);
                          else openFilters();
                        }}
                        className="inline-flex h-auto min-h-9 max-w-[min(100%,18rem)] flex-none items-center gap-2 rounded-lg border border-border/60 bg-surface/70 px-2.5 py-1.5 text-left font-body text-sm font-normal text-text shadow-none transition hover:bg-surface-2/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        <Filter size={16} className="shrink-0 text-muted" aria-hidden />
                        <span className="min-w-0 truncate">{buildMediaFilterButtonLabel(filters, config.noun)}</span>
                      </button>
                      {filterMenuOpen && !isNarrow ? (
                        <div
                          className="absolute right-0 top-full z-50 mt-2 w-[min(28rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]"
                          role="dialog"
                          aria-label={`Filter ${config.noun}`}
                        >
                          <MediaFilterPanel
                            noun={config.noun}
                            filters={draftFilters}
                            onChange={setDraftFilters}
                            onClearFilters={clearFilters}
                            onApplyFilter={applyDraftFilters}
                            onClose={() => setFilterMenuOpen(false)}
                          />
                        </div>
                      ) : null}
                    </div>
                    <label className="font-body flex min-w-0 items-center gap-2 text-sm text-muted">
                      <span className="hidden shrink-0 whitespace-nowrap sm:inline">Sort</span>
                      <select
                        aria-label={`Sort ${config.noun}`}
                        value={sortMode}
                        onChange={(e) => {
                          setSortMode(e.target.value as SortMode);
                          setPage(1);
                        }}
                        className="h-9 min-w-[8rem] max-w-full cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1 text-sm font-medium text-text outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <MediaActiveFilterChips
                  filters={filters}
                  onChange={(nextFilters) => {
                    setFilters(nextFilters);
                    setDraftFilters(nextFilters);
                    setPage(1);
                  }}
                />
              </div>

              <div className="grid min-w-0 max-w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {pageItems.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-12 text-center text-sm text-muted">
                    {config.emptyMessage}
                  </div>
                ) : (
                  pageItems.map((item) => (
                    <MediaCard key={item.id} item={item} onOpen={() => handleOpen(item)} />
                  ))
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-45 sm:px-3 sm:py-2 sm:text-sm"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  Previous
                </button>

                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition sm:h-9 sm:min-w-9 sm:px-3 sm:text-sm ${
                      n === safePage
                        ? "border-link/60 bg-link text-primary-foreground"
                        : "border-border-subtle bg-surface text-link hover:bg-link-soft-bg hover:text-link-soft-fg"
                    }`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-45 sm:px-3 sm:py-2 sm:text-sm"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </button>
              </div>
            </div>
          </PageContainer>
        </Section>
      </main>
      <ListPageFilterSheet
        open={filterMenuOpen && isNarrow}
        ariaLabel={`Filter ${config.noun}`}
        onClose={() => setFilterMenuOpen(false)}
      >
        <MediaFilterPanel
          variant="mobile-sheet"
          noun={config.noun}
          filters={draftFilters}
          onChange={setDraftFilters}
          onClearFilters={clearFilters}
          onApplyFilter={applyDraftFilters}
          onClose={() => setFilterMenuOpen(false)}
        />
      </ListPageFilterSheet>
      <ListPageMobileControls
        entityName={config.entityName}
        searchPlaceholder={`Search ${config.noun}...`}
        panelId="media-mobile-controls-panel"
        filterDefaultLabel={`Filter ${config.noun}`}
        sortAriaLabel={`Sort ${config.noun}`}
        searchQuery={searchQuery}
        onSearchQueryChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        filterLabel={buildMediaFilterButtonLabel(filters, config.noun)}
        filterMenuOpen={filterMenuOpen}
        onOpenFilters={() => {
          if (filterMenuOpen) setFilterMenuOpen(false);
          else openFilters();
        }}
        sortMode={sortMode}
        onSortModeChange={(value) => {
          setSortMode(value);
          setPage(1);
        }}
        sortOptions={SORT_OPTIONS}
      />
      {bucket === "image" && lightboxOpen ? (
        <PublicAlbumLightbox
          items={lightboxItems}
          index={lightboxIndex!}
          onClose={closeLightbox}
          onPrev={lightboxPrev}
          onNext={lightboxNext}
          onSlideshowAdvance={lightboxSlideshowAdvance}
          onShareCurrent={(m) => void shareCurrent(m)}
          onViewCurrent={viewCurrent}
        />
      ) : null}
      <MediaPlayerModal item={playerItem} onClose={() => setPlayerItem(null)} />
      <Footer />
    </div>
  );
}
