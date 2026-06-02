"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type ListPageSortOption<T extends string> = {
  value: T;
  label: string;
};

type ListPageMobileControlsProps<T extends string> = {
  entityName: string;
  searchPlaceholder: string;
  panelId: string;
  filterDefaultLabel: string;
  sortAriaLabel: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filterLabel: string;
  filterMenuOpen: boolean;
  onOpenFilters: () => void;
  sortMode: T;
  onSortModeChange: (value: T) => void;
  sortOptions: ListPageSortOption<T>[];
  /** When false, hides the filter button (search + sort only). */
  showFilterButton?: boolean;
  /** When provided, renders in place of the sort dropdown. */
  trailingSlot?: ReactNode;
  /** When provided, renders a second row inside the expanded panel, below the search/filter row. */
  belowSearchSlot?: ReactNode;
};

/**
 * Fixed bottom search / filter / sort bar for catalog list pages (Individuals, Surnames, Families).
 */
export function ListPageMobileControls<T extends string>({
  entityName,
  searchPlaceholder,
  panelId,
  filterDefaultLabel,
  sortAriaLabel,
  searchQuery,
  onSearchQueryChange,
  filterLabel,
  filterMenuOpen,
  onOpenFilters,
  sortMode,
  onSortModeChange,
  sortOptions,
  showFilterButton = true,
  trailingSlot,
  belowSearchSlot,
}: ListPageMobileControlsProps<T>) {
  const filterIsActive = filterLabel !== filterDefaultLabel;
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
            aria-controls={panelId}
            onClick={() => setExpanded((value) => !value)}
          >
            <span className="font-body text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#8b2e2e]">
              Search {entityName}
            </span>
            {expanded ? (
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted" aria-hidden />
            ) : (
              <ChevronUp className="ml-auto h-4 w-4 shrink-0 text-muted" aria-hidden />
            )}
          </button>
        </div>
        <div id={panelId} className={expanded ? "space-y-2" : "hidden"}>
          <div className="flex items-center gap-1.5">
          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-link/80" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-2xl border border-border-subtle bg-[rgba(255,250,240,0.74)] px-9 text-sm text-heading shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition placeholder:text-muted/70 focus:border-link/50 focus:ring-2 focus:ring-link/15"
            />
          </label>
          {showFilterButton ? (
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
          ) : null}
          {trailingSlot ?? (
            <label className={cn("relative block shrink-0", showFilterButton ? "w-24" : "w-[7.5rem]")}>
              <span className="sr-only">{sortAriaLabel}</span>
              <select
                aria-label={sortAriaLabel}
                value={sortMode}
                onChange={(event) => onSortModeChange(event.target.value as T)}
                className="h-10 w-full cursor-pointer rounded-2xl border border-border-subtle bg-[rgba(255,250,240,0.58)] px-3 text-sm font-semibold text-heading shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          </div>
          {belowSearchSlot}
        </div>
      </div>
    </aside>
  );
}
