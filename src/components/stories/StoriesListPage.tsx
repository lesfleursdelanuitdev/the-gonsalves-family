"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";
import { ListPageFilterSheet, ListPageMobileControls } from "@/components/list-page";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import { StoryCard } from "@/components/stories/StoryCard";
import type { StoryListItem } from "@/lib/stories/story-queries";

type SortMode = "newest" | "oldest" | "az" | "za";

const PAGE_SIZE = 12;
const FILTER_DEFAULT_LABEL = "Filter";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
];

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

function buildFilterLabel(selectedTags: string[]): string {
  if (selectedTags.length === 0) return FILTER_DEFAULT_LABEL;
  return selectedTags.length === 1 ? "1 tag" : `${selectedTags.length} tags`;
}

function TagFilterPanel({
  allTags,
  selectedTags,
  onToggleTag,
  onClear,
  onApply,
  onClose,
}: {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClear: () => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_20px_50px_rgba(60,45,25,0.16)]">
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle/70 px-4 py-3">
        <span className="text-sm font-semibold text-heading">Filter by tag</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-muted transition hover:text-text"
          aria-label="Close filter"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-wrap gap-2 p-4">
          {allTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "border-link/60 bg-link text-primary-foreground"
                    : "border-border-subtle bg-surface text-muted hover:border-link/40 hover:bg-link-soft-bg hover:text-link-soft-fg"
                }`}
              >
                {tag}
              </button>
            );
          })}
          {allTags.length === 0 ? (
            <p className="text-sm text-muted">No tags available.</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t border-border-subtle/70 px-4 py-3">
        <button
          type="button"
          onClick={onClear}
          disabled={selectedTags.length === 0}
          className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-muted transition hover:bg-surface-2 disabled:opacity-40"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onApply}
          className="rounded-lg bg-link px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export function StoriesListPage({
  stories,
  heading,
  description,
  emptyMessage,
}: {
  stories: StoryListItem[];
  heading: string;
  description: string;
  emptyMessage: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)") : null;
    if (!mq) return;
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const story of stories) {
      for (const tag of (story.tags as string[] | null) ?? []) set.add(tag);
    }
    return Array.from(set).sort();
  }, [stories]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const bySearch = q
      ? stories.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            (s.excerpt ?? "").toLowerCase().includes(q) ||
            (s.author?.name ?? s.author?.username ?? "").toLowerCase().includes(q),
        )
      : stories;

    const byTags =
      selectedTags.length > 0
        ? bySearch.filter((s) => selectedTags.every((t) => ((s.tags as string[] | null) ?? []).includes(t)))
        : bySearch;

    const sorted = [...byTags];
    sorted.sort((a, b) => {
      if (sortMode === "newest") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortMode === "oldest") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortMode === "az") return a.title.localeCompare(b.title);
      return b.title.localeCompare(a.title);
    });
    return sorted;
  }, [stories, searchQuery, sortMode, selectedTags]);

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

  const filterLabel = buildFilterLabel(selectedTags);

  const openFilters = () => {
    setDraftTags(selectedTags);
    setFilterMenuOpen(true);
  };

  const applyDraftFilters = () => {
    setSelectedTags(draftTags);
    setFilterMenuOpen(false);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftTags([]);
    setSelectedTags([]);
    setPage(1);
  };

  const toggleDraftTag = (tag: string) => {
    setDraftTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const removeAppliedTag = (tag: string) => {
    const next = selectedTags.filter((t) => t !== tag);
    setSelectedTags(next);
    setDraftTags(next);
    setPage(1);
  };

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg pb-32 text-text sm:pb-0">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section noPadding className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg/95 to-surface-2" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_60%_40%,rgba(180,140,90,0.12),transparent)]" />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <div className="min-w-0 max-w-full space-y-5 py-4">
                <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                  {heading}
                </h1>
                <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />
                <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                  {description}
                </p>
              </div>
            </PageContainer>
          </div>
        </Section>

        <Section noPadding className="min-w-0 overflow-x-hidden pb-6 pt-2 sm:py-8 md:py-10">
          <PageContainer narrow>
            <div className="min-w-0 max-w-full space-y-5">
              <div className="min-w-0 max-w-full rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-[0_10px_26px_rgba(60,45,25,0.06)] sm:p-5">
                <div className="grid min-w-0 max-w-full gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
                  <p className="text-sm font-semibold text-heading">
                    {filtered.length} {heading}
                  </p>

                  <label className="relative hidden min-w-0 sm:block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder={`Search ${heading.toLowerCase()}...`}
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
                        <span className="min-w-0 truncate">{filterLabel}</span>
                      </button>
                      {filterMenuOpen && !isNarrow ? (
                        <div
                          className="absolute right-0 top-full z-50 mt-2 w-[min(36rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]"
                          role="dialog"
                          aria-label={`Filter ${heading.toLowerCase()}`}
                        >
                          <TagFilterPanel
                            allTags={allTags}
                            selectedTags={draftTags}
                            onToggleTag={toggleDraftTag}
                            onClear={clearFilters}
                            onApply={applyDraftFilters}
                            onClose={() => setFilterMenuOpen(false)}
                          />
                        </div>
                      ) : null}
                    </div>
                    <label className="font-body flex min-w-0 items-center gap-2 text-sm text-muted">
                      <span className="hidden shrink-0 whitespace-nowrap sm:inline">Sort</span>
                      <select
                        aria-label={`Sort ${heading.toLowerCase()}`}
                        value={sortMode}
                        onChange={(e) => {
                          setSortMode(e.target.value as SortMode);
                          setPage(1);
                        }}
                        className="h-9 min-w-[9rem] max-w-full cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1 text-sm font-medium text-text outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {selectedTags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#e5dccf] bg-[#faf7f2]/90 px-2 py-0.5 font-body text-[11px] text-heading shadow-sm"
                      >
                        <span className="min-w-0 truncate">{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeAppliedTag(tag)}
                          className="shrink-0 rounded-full p-0.5 text-muted transition hover:bg-black/[0.06] hover:text-text"
                          aria-label={`Remove ${tag} filter`}
                        >
                          <X size={12} aria-hidden />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid min-w-0 max-w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pageItems.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-12 text-center text-sm text-muted">
                    {searchQuery || selectedTags.length > 0
                      ? `No ${heading.toLowerCase()} match this filter.`
                      : emptyMessage}
                  </div>
                ) : (
                  pageItems.map((story) => <StoryCard key={story.id} story={story} />)
                )}
              </div>

              {totalPages > 1 ? (
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
              ) : null}
            </div>
          </PageContainer>
        </Section>
      </main>
      <ListPageFilterSheet
        open={filterMenuOpen && isNarrow}
        ariaLabel={`Filter ${heading.toLowerCase()}`}
        onClose={() => setFilterMenuOpen(false)}
      >
        <TagFilterPanel
          allTags={allTags}
          selectedTags={draftTags}
          onToggleTag={toggleDraftTag}
          onClear={clearFilters}
          onApply={applyDraftFilters}
          onClose={() => setFilterMenuOpen(false)}
        />
      </ListPageFilterSheet>
      <ListPageMobileControls
        entityName={heading}
        searchPlaceholder={`Search ${heading.toLowerCase()}...`}
        panelId="stories-mobile-controls-panel"
        filterDefaultLabel={FILTER_DEFAULT_LABEL}
        sortAriaLabel={`Sort ${heading.toLowerCase()}`}
        searchQuery={searchQuery}
        onSearchQueryChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        filterLabel={filterLabel}
        filterMenuOpen={filterMenuOpen}
        onOpenFilters={() => {
          if (filterMenuOpen) setFilterMenuOpen(false);
          else openFilters();
        }}
        sortMode={sortMode}
        onSortModeChange={(value) => {
          setSortMode(value as SortMode);
          setPage(1);
        }}
        sortOptions={SORT_OPTIONS}
      />
      <Footer />
    </div>
  );
}
