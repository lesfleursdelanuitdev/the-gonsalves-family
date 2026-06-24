"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { ListPageMobileControls } from "@/components/list-page";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import { OpenQuestionCard } from "@/components/research/OpenQuestionCard";
import type { PublicOpenQuestion } from "@/lib/research/load-public-open-questions";

type SortMode = "newest" | "oldest" | "az" | "za";

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
];

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function OpenQuestionsPage({ questions }: { questions: PublicOpenQuestion[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNarrow, setIsNarrow] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [page, setPage] = useState(1);

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
    const bySearch = questions.filter((item) => {
      if (!q) return true;
      const haystack = `${item.question} ${item.details ?? ""} ${item.linkedIndividual?.fullName ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });

    const sorted = [...bySearch];
    sorted.sort((a, b) => {
      if (sortMode === "newest") return b.createdAtTime - a.createdAtTime;
      if (sortMode === "oldest") return a.createdAtTime - b.createdAtTime;
      if (sortMode === "az") return a.question.localeCompare(b.question);
      return b.question.localeCompare(a.question);
    });
    return sorted;
  }, [questions, searchQuery, sortMode]);

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

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg pb-32 text-text sm:pb-0">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section noPadding className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image src="/images/searchHeader.png" alt="" fill priority className="object-cover object-center" sizes="100vw" />
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
                    <Link href="/research" className="min-w-0 shrink transition hover:text-link">
                      Research
                    </Link>
                    <span className="shrink-0 text-subtle">/</span>
                    <span className="min-w-0 text-heading">Open questions</span>
                  </nav>

                  <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                    Open questions
                  </h1>

                  <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                  <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                    Unresolved research items that still need verification, sources, or clarification in the
                    published family tree.
                  </p>
                </div>

                <div className="relative hidden min-h-[280px] overflow-hidden rounded-2xl border border-white/15 bg-black/10 shadow-[0_20px_50px_rgba(25,18,12,0.35)] lg:block">
                  <Image
                    src="/images/oldMapBackground.png"
                    alt=""
                    fill
                    className="object-cover object-center opacity-90 sepia-[0.22]"
                    sizes="40vw"
                  />
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
                  <p className="text-sm font-semibold text-heading">{filtered.length} Open questions</p>

                  <label className="relative hidden min-w-0 sm:block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search open questions..."
                      className="w-full rounded-xl border border-border-subtle bg-surface px-9 py-2.5 text-sm text-heading shadow-inner outline-none transition placeholder:text-muted/70 focus:border-link/50 focus:ring-2 focus:ring-link/15"
                    />
                  </label>

                  <div className="hidden flex-wrap items-center gap-2 rounded-xl border border-border/40 bg-black/[0.03] p-1.5 sm:flex">
                    <label className="font-body flex min-w-0 items-center gap-2 text-sm text-muted">
                      <span className="hidden shrink-0 whitespace-nowrap sm:inline">Sort</span>
                      <select
                        aria-label="Sort open questions"
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
              </div>

              <div className="grid min-w-0 max-w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {pageItems.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-12 text-center text-sm text-muted">
                    {questions.length === 0
                      ? "No open questions in the published tree."
                      : "No open questions match this search."}
                  </div>
                ) : (
                  pageItems.map((question) => <OpenQuestionCard key={question.id} question={question} />)
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
      <ListPageMobileControls
        entityName="Open questions"
        searchPlaceholder="Search open questions..."
        panelId="open-questions-mobile-controls-panel"
        filterDefaultLabel="Filter open questions"
        sortAriaLabel="Sort open questions"
        searchQuery={searchQuery}
        onSearchQueryChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        filterLabel="Filter open questions"
        filterMenuOpen={false}
        onOpenFilters={() => {}}
        sortMode={sortMode}
        onSortModeChange={(value) => {
          setSortMode(value);
          setPage(1);
        }}
        sortOptions={SORT_OPTIONS}
        showFilterButton={false}
      />
      <Footer />
    </div>
  );
}
