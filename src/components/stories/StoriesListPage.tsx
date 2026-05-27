"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import { StoryCard } from "@/components/stories/StoryCard";
import type { StoryListItem } from "@/lib/stories/story-queries";

type SortMode = "newest" | "oldest" | "az" | "za";

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
];

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
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

    const sorted = [...bySearch];
    sorted.sort((a, b) => {
      if (sortMode === "newest") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortMode === "oldest") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortMode === "az") return a.title.localeCompare(b.title);
      return b.title.localeCompare(a.title);
    });
    return sorted;
  }, [stories, searchQuery, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => paginate(filtered, safePage, PAGE_SIZE), [filtered, safePage]);

  const pageNumbers = useMemo(() => {
    const halfWindow = 2;
    const start = Math.max(1, Math.min(safePage - halfWindow, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [safePage, totalPages]);

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
                  <p className="text-sm font-semibold text-heading">{filtered.length} {heading}</p>

                  <label className="relative min-w-0">
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

                  <label className="flex min-w-0 items-center gap-2 text-sm text-muted">
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
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="grid min-w-0 max-w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pageItems.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-12 text-center text-sm text-muted">
                    {searchQuery ? `No ${heading.toLowerCase()} match this search.` : emptyMessage}
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
      <Footer />
    </div>
  );
}
