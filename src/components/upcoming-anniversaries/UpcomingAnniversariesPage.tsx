"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Filter, LayoutGrid, List, Search } from "lucide-react";
import { ListPageFilterSheet, ListPageMobileControls } from "@/components/list-page";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import {
  createUpcomingAnniversariesFilters,
  filterUpcomingAnniversaryMonthGroups,
  listAvailableAnniversaryDays,
  listAvailableAnniversaryMonths,
} from "@/lib/upcoming-anniversaries/filter-upcoming-anniversaries";
import type { UpcomingAnniversariesPageData } from "@/lib/upcoming-anniversaries/load-upcoming-anniversaries-page-data";
import {
  UpcomingAnniversariesActiveFilterChips,
  UpcomingAnniversariesFilterPanel,
  buildUpcomingAnniversariesFilterButtonLabel,
  type UpcomingAnniversariesFilterState,
} from "./UpcomingAnniversariesFilterPanel";
import { UpcomingAnniversaryOccasionCard } from "./UpcomingAnniversaryOccasionCard";
import { UpcomingAnniversaryListItem } from "./UpcomingAnniversaryListItem";

type ViewMode = "cards" | "list";

export function UpcomingAnniversariesPage({ data }: { data: UpcomingAnniversariesPageData }) {
  const availableMonths = useMemo(
    () => listAvailableAnniversaryMonths(data.monthGroups),
    [data.monthGroups],
  );
  const availableDays = useMemo(
    () => listAvailableAnniversaryDays(data.monthGroups),
    [data.monthGroups],
  );
  const availableMonthNumbers = useMemo(
    () => availableMonths.map((month) => month.month),
    [availableMonths],
  );
  const availableDayKeys = useMemo(
    () => availableDays.map((day) => day.key),
    [availableDays],
  );
  const defaultFilters = useMemo(
    () => createUpcomingAnniversariesFilters(availableMonthNumbers, availableDayKeys),
    [availableMonthNumbers, availableDayKeys],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<UpcomingAnniversariesFilterState>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<UpcomingAnniversariesFilterState>(defaultFilters);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  useEffect(() => {
    const mq = typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)") : null;
    if (!mq) return;
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setFilters(defaultFilters);
    setDraftFilters(defaultFilters);
  }, [defaultFilters]);

  const { monthGroups, totalCount } = useMemo(
    () => filterUpcomingAnniversaryMonthGroups(data.monthGroups, searchQuery, filters),
    [data.monthGroups, searchQuery, filters],
  );

  const openFilters = () => {
    setDraftFilters(filters);
    setFilterMenuOpen(true);
  };

  const clearFilters = () => {
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  const applyDraftFilters = () => {
    setFilters(draftFilters);
    setFilterMenuOpen(false);
  };

  const hasAnyEvents = data.totalCount > 0;

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg pb-32 text-text sm:pb-0">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section noPadding className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image
              src="/images/albumsCoverImageMobile.png"
              alt=""
              fill
              priority
              className="object-cover md:hidden"
              sizes="100vw"
            />
            <Image
              src="/images/albumsCoverImage.png"
              alt=""
              fill
              priority
              className="hidden object-cover md:block"
              sizes="100vw"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-bg/96 via-bg/82 to-bg/35 md:from-bg/92 md:via-bg/78 md:to-bg/20"
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-bg to-transparent" />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <div className="min-w-0 max-w-full space-y-5 p-5 backdrop-blur-md [-webkit-backdrop-filter:blur(14px)] [backdrop-filter:blur(14px)] sm:p-6">
              <nav
                aria-label="Breadcrumb"
                className="flex min-w-0 flex-wrap items-center gap-2 text-xs tracking-[0.06em] text-muted"
              >
                <Link href="/" className="min-w-0 shrink transition hover:text-link">
                  Home
                </Link>
                <span className="shrink-0 text-subtle">/</span>
                <span className="min-w-0 text-heading">Upcoming anniversaries</span>
              </nav>

              <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                Upcoming anniversaries
              </h1>

              <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

              <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                Birthdays, days of remembrance, and wedding anniversaries from our family tree in the next three
                months ({data.windowLabel}). Browse by month and occasion type.
              </p>
              </div>
            </PageContainer>
          </div>
        </Section>

        <Section noPadding className="min-w-0 overflow-x-hidden pb-6 pt-2 sm:py-8 md:py-10">
          <PageContainer narrow>
            {!hasAnyEvents ? (
              <div className="rounded-2xl border border-border/80 bg-surface/90 px-6 py-12 text-center shadow-[0_10px_26px_rgba(60,45,25,0.06)]">
                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted" strokeWidth={1.5} aria-hidden />
                <p className="font-heading text-lg font-semibold text-heading">Nothing on the calendar yet</p>
                <p className="mt-2 text-sm text-muted">
                  No birthdays, death anniversaries, or marriage anniversaries fall in the next three months with a
                  known month and day.
                </p>
              </div>
            ) : (
              <div className="min-w-0 max-w-full space-y-5">
                <div className="min-w-0 max-w-full overflow-visible rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-[0_10px_26px_rgba(60,45,25,0.06)] sm:p-5">
                  <div className="grid min-w-0 max-w-full gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
                    <p className="text-sm font-semibold text-heading">
                      {totalCount} {totalCount === 1 ? "occasion" : "occasions"}
                    </p>

                    <label className="relative hidden min-w-0 sm:block">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                        aria-hidden
                      />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search anniversaries..."
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
                          <span className="min-w-0 truncate">
                            {buildUpcomingAnniversariesFilterButtonLabel(filters, availableMonthNumbers, availableDayKeys)}
                          </span>
                        </button>
                        {filterMenuOpen && !isNarrow ? (
                          <div
                            className="absolute right-0 top-full z-50 mt-2 w-[min(42rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]"
                            role="dialog"
                            aria-label="Filter anniversaries"
                          >
                            <UpcomingAnniversariesFilterPanel
                              filters={draftFilters}
                              availableMonths={availableMonths}
                              availableDays={availableDays}
                              onChange={setDraftFilters}
                              onClearFilters={clearFilters}
                              onApplyFilter={applyDraftFilters}
                              onClose={() => setFilterMenuOpen(false)}
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center rounded-lg border border-border-subtle bg-surface p-0.5">
                        <button
                          type="button"
                          onClick={() => setViewMode("cards")}
                          aria-label="Card view"
                          aria-pressed={viewMode === "cards"}
                          className={`rounded-md p-1.5 transition ${viewMode === "cards" ? "bg-link text-primary-foreground shadow-sm" : "text-muted hover:text-heading"}`}
                        >
                          <LayoutGrid className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode("list")}
                          aria-label="List view"
                          aria-pressed={viewMode === "list"}
                          className={`rounded-md p-1.5 transition ${viewMode === "list" ? "bg-link text-primary-foreground shadow-sm" : "text-muted hover:text-heading"}`}
                        >
                          <List className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>

                  <UpcomingAnniversariesActiveFilterChips
                    filters={filters}
                    availableMonths={availableMonths}
                    availableDays={availableDays}
                    onChange={(nextFilters) => {
                      setFilters(nextFilters);
                      setDraftFilters(nextFilters);
                    }}
                  />
                </div>

                {totalCount === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-12 text-center text-sm text-muted">
                    No anniversaries match this search or filter.
                  </div>
                ) : (
                  <div className="space-y-12">
                    {monthGroups.map((group) => (
                      <section key={group.month} aria-labelledby={`month-${group.month}`} className="min-w-0">
                        <h2
                          id={`month-${group.month}`}
                          className="mb-6 border-b border-border-subtle pb-3 font-heading text-2xl font-semibold text-heading sm:text-3xl"
                        >
                          {group.monthLabel}
                        </h2>
                        <div className="space-y-10">
                          {group.sections.map((section) => (
                            <div key={`${group.month}-${section.eventType}`} className="min-w-0 space-y-4">
                              <h3 className="font-heading text-xl font-semibold text-heading sm:text-2xl">
                                {section.label}
                                <span className="ml-2 text-base font-normal tabular-nums text-muted sm:text-lg">
                                  ({section.items.length})
                                </span>
                              </h3>
                              {viewMode === "cards" ? (
                                <ul className="grid min-w-0 list-none gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                  {section.items.map((item) => (
                                    <li key={item.eventId} className="min-w-0">
                                      <UpcomingAnniversaryOccasionCard item={item} />
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <ul className="list-none divide-y divide-border-subtle/50">
                                  {section.items.map((item) => (
                                    <li key={item.eventId} className="min-w-0">
                                      <UpcomingAnniversaryListItem item={item} />
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            )}
          </PageContainer>
        </Section>
      </main>

      <ListPageFilterSheet
        open={filterMenuOpen && isNarrow}
        ariaLabel="Filter anniversaries"
        onClose={() => setFilterMenuOpen(false)}
      >
        <UpcomingAnniversariesFilterPanel
          variant="mobile-sheet"
          filters={draftFilters}
          availableMonths={availableMonths}
          availableDays={availableDays}
          onChange={setDraftFilters}
          onClearFilters={clearFilters}
          onApplyFilter={applyDraftFilters}
          onClose={() => setFilterMenuOpen(false)}
        />
      </ListPageFilterSheet>

      {hasAnyEvents ? (
        <ListPageMobileControls
          entityName="Anniversaries"
          searchPlaceholder="Search anniversaries..."
          panelId="upcoming-anniversaries-mobile-controls-panel"
          filterDefaultLabel="Filter anniversaries"
          sortAriaLabel="Sort anniversaries"
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          filterLabel={buildUpcomingAnniversariesFilterButtonLabel(filters, availableMonthNumbers, availableDayKeys)}
          filterMenuOpen={filterMenuOpen}
          onOpenFilters={() => {
            if (filterMenuOpen) setFilterMenuOpen(false);
            else openFilters();
          }}
          sortMode="calendar"
          onSortModeChange={() => {}}
          sortOptions={[]}
          trailingSlot={
            <div className="flex items-center rounded-2xl border border-border-subtle bg-[rgba(255,250,240,0.58)] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                aria-label="Card view"
                aria-pressed={viewMode === "cards"}
                className={`rounded-xl p-2 transition ${viewMode === "cards" ? "bg-link text-primary-foreground shadow-sm" : "text-muted hover:text-heading"}`}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
                className={`rounded-xl p-2 transition ${viewMode === "list" ? "bg-link text-primary-foreground shadow-sm" : "text-muted hover:text-heading"}`}
              >
                <List className="h-4 w-4" aria-hidden />
              </button>
            </div>
          }
        />
      ) : null}

      <Footer />
    </div>
  );
}
