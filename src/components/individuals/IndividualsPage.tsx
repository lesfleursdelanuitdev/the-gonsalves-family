"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Filter, Search } from "lucide-react";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import {
  buildIndividualsFilterButtonLabel,
  EMPTY_INDIVIDUALS_FILTERS,
  IndividualsActiveFilterChips,
  IndividualsFilterPanel,
  type GenderFilter,
  type IndividualsFilterState,
} from "./IndividualsFilterPanel";
import { PersonCard } from "./PersonCard";
import type { PublicIndividual } from "./types";

type SortMode = "az" | "za" | "oldest" | "youngest";

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
  { value: "oldest", label: "Oldest first" },
  { value: "youngest", label: "Youngest first" },
];

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function parseYear(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function personAge(person: PublicIndividual, currentYear: number): number | null {
  if (person.birthYear == null) return null;
  const endYear = person.deathYear ?? currentYear;
  return Math.max(0, endYear - person.birthYear);
}

function personGenderBucket(person: PublicIndividual): Exclude<GenderFilter, "all"> {
  const value = `${person.gender ?? ""} ${person.sex ?? ""}`.trim().toLowerCase();
  if (value === "f" || value.includes("female")) return "female";
  if (value === "m" || value.includes("male")) return "male";
  return "unknown";
}

function matchesRange(value: number | null, min: number | null, max: number | null): boolean {
  if (min == null && max == null) return true;
  if (value == null) return false;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

function IndividualsMobileControls({
  searchQuery,
  onSearchQueryChange,
  filterLabel,
  filterMenuOpen,
  onOpenFilters,
  sortMode,
  onSortModeChange,
}: {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filterLabel: string;
  filterMenuOpen: boolean;
  onOpenFilters: () => void;
  sortMode: SortMode;
  onSortModeChange: (value: SortMode) => void;
}) {
  const filterIsActive = filterLabel !== "Filter individuals";
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] sm:hidden">
      <div
        className={`pointer-events-auto w-full border-t border-border-subtle/90 bg-surface-elevated/95 px-4 shadow-[0_-14px_42px_rgba(60,45,25,0.16)] backdrop-blur-md ${
          expanded ? "py-3" : "py-1.5"
        }`}
        style={{
          WebkitBackdropFilter: "blur(16px)",
          backgroundImage:
            "linear-gradient(180deg, rgba(255,248,232,0.96), rgba(247,241,228,0.93)), radial-gradient(circle at 84% 12%, rgba(195,164,90,0.12), transparent 34%)",
        }}
      >
        <div className={`${expanded ? "mb-1.5" : ""} flex items-center justify-between gap-3`}>
          <button
            type="button"
            className="flex min-h-9 min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            aria-expanded={expanded}
            aria-controls="individuals-mobile-controls-panel"
            onClick={() => setExpanded((value) => !value)}
          >
            <span className="font-body text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#8b2e2e]">
              Search Individuals
            </span>
            {expanded ? (
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted" aria-hidden />
            ) : (
              <ChevronUp className="ml-auto h-4 w-4 shrink-0 text-muted" aria-hidden />
            )}
          </button>
        </div>
        <div id="individuals-mobile-controls-panel" className={expanded ? "flex items-center gap-1.5" : "hidden"}>
          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-link/80" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search individuals..."
              className="h-10 w-full rounded-2xl border border-border-subtle bg-[rgba(255,250,240,0.74)] px-9 text-sm text-heading shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition placeholder:text-muted/70 focus:border-link/50 focus:ring-2 focus:ring-link/15"
            />
          </label>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={filterMenuOpen}
            aria-label={filterLabel}
            title={filterLabel}
            onClick={onOpenFilters}
            className="relative inline-flex h-10 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-[rgba(255,250,240,0.58)] text-link shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:bg-link-soft-bg hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Filter className="h-4 w-4" aria-hidden />
            {filterIsActive ? (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#8b2e2e]" aria-hidden />
            ) : null}
          </button>
          <label className="relative block w-24 shrink-0">
            <span className="sr-only">Sort individuals</span>
            <select
              aria-label="Sort individuals"
              value={sortMode}
              onChange={(event) => onSortModeChange(event.target.value as SortMode)}
              className="h-10 w-full cursor-pointer rounded-2xl border border-border-subtle bg-[rgba(255,250,240,0.58)] px-3 text-sm font-semibold text-heading shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition focus-visible:ring-2 focus-visible:ring-focus-ring"
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
    </aside>
  );
}

export function IndividualsPage({ individuals }: { individuals: PublicIndividual[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<IndividualsFilterState>(EMPTY_INDIVIDUALS_FILTERS);
  const [draftFilters, setDraftFilters] = useState<IndividualsFilterState>(EMPTY_INDIVIDUALS_FILTERS);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("az");
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
    const ageMin = parseYear(filters.minAge);
    const ageMax = parseYear(filters.maxAge);
    const birthMin = parseYear(filters.minBirthYear);
    const birthMax = parseYear(filters.maxBirthYear);
    const deathMin = parseYear(filters.minDeathYear);
    const deathMax = parseYear(filters.maxDeathYear);
    const currentYear = new Date().getFullYear();

    const byFilters = individuals.filter((person) => {
      if (q && !person.fullName.toLowerCase().includes(q)) return false;
      if (filters.lifeStatus === "living" && person.deathYear != null) return false;
      if (filters.lifeStatus === "dead" && person.deathYear == null) return false;
      if (filters.gender !== "all" && personGenderBucket(person) !== filters.gender) return false;
      if (!matchesRange(personAge(person, currentYear), ageMin, ageMax)) return false;
      if (!matchesRange(person.birthYear, birthMin, birthMax)) return false;
      if (!matchesRange(person.deathYear, deathMin, deathMax)) return false;
      if (filters.married === "yes" && !person.hasPartner) return false;
      if (filters.married === "no" && person.hasPartner) return false;
      if (filters.hasKids === "yes" && !person.hasChildren) return false;
      if (filters.hasKids === "no" && person.hasChildren) return false;
      return true;
    });

    const sorted = [...byFilters];
    sorted.sort((a, b) => {
      if (sortMode === "az") return a.fullName.localeCompare(b.fullName);
      if (sortMode === "za") return b.fullName.localeCompare(a.fullName);
      if (sortMode === "oldest") return (a.birthYear ?? 9999) - (b.birthYear ?? 9999);
      return (b.birthYear ?? -9999) - (a.birthYear ?? -9999);
    });
    return sorted;
  }, [
    individuals,
    searchQuery,
    filters,
    sortMode,
  ]);

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

  const openFilters = () => {
    setDraftFilters(filters);
    setFilterMenuOpen(true);
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_INDIVIDUALS_FILTERS);
    setFilters(EMPTY_INDIVIDUALS_FILTERS);
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
                    <Link href="/tree" className="min-w-0 shrink transition hover:text-link">
                      Family Tree
                    </Link>
                    <span className="shrink-0 text-subtle">/</span>
                    <span className="min-w-0 text-heading">Individuals</span>
                  </nav>

                  <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                    Individuals
                  </h1>

                  <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                  <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                    Explore the people who shaped our family&apos;s story. Browse individuals in our family tree and
                    discover their lives, photos, and memories.
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
                  <p className="text-sm font-semibold text-heading">{filtered.length} Individuals</p>

                  <label className="relative hidden min-w-0 sm:block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search individuals..."
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
                        <span className="min-w-0 truncate">{buildIndividualsFilterButtonLabel(filters)}</span>
                      </button>
                      {filterMenuOpen && !isNarrow ? (
                        <div
                          className="absolute right-0 top-full z-50 mt-2 w-[min(42rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]"
                          role="dialog"
                          aria-label="Filter individuals"
                        >
                          <IndividualsFilterPanel
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
                        aria-label="Sort individuals"
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

                <IndividualsActiveFilterChips
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
                    No individuals match this search.
                  </div>
                ) : (
                  pageItems.map((person) => <PersonCard key={person.id} person={person} />)
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
      {filterMenuOpen && isNarrow && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[10040] font-body">
              <button
                type="button"
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                aria-label="Dismiss filter"
                onClick={() => setFilterMenuOpen(false)}
              />
              <div
                className="album-filter-sheet-enter absolute bottom-0 left-0 right-0 flex max-h-[min(88dvh,720px)] min-h-0 flex-col overflow-hidden rounded-t-2xl border border-[#e8e0d4] bg-[#f5f1ea] shadow-[0_-12px_48px_rgba(0,0,0,0.14)]"
                role="dialog"
                aria-label="Filter individuals"
              >
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <IndividualsFilterPanel
                    variant="mobile-sheet"
                    filters={draftFilters}
                    onChange={setDraftFilters}
                    onClearFilters={clearFilters}
                    onApplyFilter={applyDraftFilters}
                    onClose={() => setFilterMenuOpen(false)}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      <IndividualsMobileControls
        searchQuery={searchQuery}
        onSearchQueryChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        filterLabel={buildIndividualsFilterButtonLabel(filters)}
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
      />
      <Footer />
    </div>
  );
}
