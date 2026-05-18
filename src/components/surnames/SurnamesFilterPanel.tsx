"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  CaseSensitive,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SURNAME_LETTER_OTHER,
  type SurnameRankFilter,
} from "@/lib/surnames/surname-list-helpers";

export type SurnamesFilterState = {
  letter: string | null;
  rankFilter: SurnameRankFilter;
};

type SurnamesFilterSection = "letter" | "frequency";

export const EMPTY_SURNAMES_FILTERS: SurnamesFilterState = {
  letter: null,
  rankFilter: "all",
};

const SELECTED_ROW = "bg-[#f2ece4]";
const LETTER_CHIP =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 font-body text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function withFilter(
  filters: SurnamesFilterState,
  patch: Partial<SurnamesFilterState>,
): SurnamesFilterState {
  return { ...filters, ...patch };
}

export function hasActiveSurnamesFilters(filters: SurnamesFilterState): boolean {
  return filters.letter != null || filters.rankFilter !== "all";
}

function activeFilterCount(filters: SurnamesFilterState): number {
  let count = 0;
  if (filters.letter != null) count++;
  if (filters.rankFilter !== "all") count++;
  return count;
}

export function buildSurnamesFilterButtonLabel(filters: SurnamesFilterState): string {
  const count = activeFilterCount(filters);
  return count === 0 ? "Filter surnames" : `${count} filter${count === 1 ? "" : "s"} active`;
}

function letterSummary(filters: SurnamesFilterState): string {
  if (filters.letter == null) return "Any starting letter";
  if (filters.letter === SURNAME_LETTER_OTHER) return "Starts with #";
  return `Starts with ${filters.letter}`;
}

function frequencySummary(filters: SurnamesFilterState): string {
  if (filters.rankFilter === "top10") return "Top 10 by people in tree";
  if (filters.rankFilter === "bottom10") return "Bottom 10 by people in tree";
  return "Any frequency rank";
}

function sectionSummary(section: SurnamesFilterSection, filters: SurnamesFilterState): string {
  return section === "letter" ? letterSummary(filters) : frequencySummary(filters);
}

function FilterNavRow({
  icon: Icon,
  label,
  summary,
  selected,
  onClick,
  minTouch,
}: {
  icon: typeof CaseSensitive;
  label: string;
  summary: string;
  selected: boolean;
  onClick: () => void;
  minTouch?: boolean;
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg text-left font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          minTouch ? "min-h-[52px] px-1 py-2" : "px-1 py-2",
          selected ? `${SELECTED_ROW} text-heading` : "text-text hover:bg-black/[0.03]",
        )}
      >
        <Icon size={18} className="shrink-0 text-muted" aria-hidden />
        <span className="min-w-0 flex-1 font-medium">{label}</span>
        <ChevronRight size={18} className="shrink-0 text-muted/80" aria-hidden />
      </button>
      <p className="pl-1 font-body text-xs leading-snug text-[#8b2e2e]/90">{summary}</p>
    </div>
  );
}

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <div className="mt-2 space-y-1" role="listbox" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                selected ? `${SELECTED_ROW} font-medium text-heading` : "text-text hover:bg-black/[0.025]",
              )}
            >
              {selected ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#8b2e2e]">
                  <Check size={14} className="text-white" strokeWidth={2.5} aria-hidden />
                </span>
              ) : (
                <span className="size-6 shrink-0 rounded-full border-2 border-[#c9bfb2] bg-white" />
              )}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActiveSurnamesFilterChips({
  filters,
  onChange,
  compact,
}: {
  filters: SurnamesFilterState;
  onChange: (filters: SurnamesFilterState) => void;
  compact?: boolean;
}) {
  const chips: ReactNode[] = [];
  const chipClass =
    "inline-flex max-w-full items-center gap-1 rounded-full border border-[#e5dccf] bg-[#faf7f2]/90 px-2 py-0.5 font-body text-[11px] text-heading shadow-sm";

  if (filters.letter != null) {
    chips.push(
      <span key="letter" className={chipClass}>
        <span className="min-w-0 truncate">
          Letter: {filters.letter === SURNAME_LETTER_OTHER ? "#" : filters.letter}
        </span>
        <button
          type="button"
          className="shrink-0 rounded-full p-0.5 text-muted hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          onClick={() => onChange(withFilter(filters, { letter: null }))}
          aria-label="Remove letter filter"
        >
          <X size={12} aria-hidden />
        </button>
      </span>,
    );
  }

  if (filters.rankFilter !== "all") {
    chips.push(
      <span key="rank" className={chipClass}>
        <span className="min-w-0 truncate">
          {filters.rankFilter === "top10" ? "Top 10 surnames" : "Bottom 10 surnames"}
        </span>
        <button
          type="button"
          className="shrink-0 rounded-full p-0.5 text-muted hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          onClick={() => onChange(withFilter(filters, { rankFilter: "all" }))}
          aria-label="Remove frequency rank filter"
        >
          <X size={12} aria-hidden />
        </button>
      </span>,
    );
  }

  if (chips.length === 0) {
    return (
      <p className={cn("font-body text-xs text-muted/70", compact ? "py-1" : "py-1.5")}>No active filters yet</p>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", compact ? "py-1" : "py-1.5")} role="list" aria-label="Active filters">
      {chips}
    </div>
  );
}

export function SurnamesActiveFilterChips({
  filters,
  onChange,
}: {
  filters: SurnamesFilterState;
  onChange: (filters: SurnamesFilterState) => void;
}) {
  if (!hasActiveSurnamesFilters(filters)) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <ActiveSurnamesFilterChips filters={filters} onChange={onChange} compact />
    </div>
  );
}

function LetterSectionDetail({
  filters,
  availableLetters,
  onChange,
}: {
  filters: SurnamesFilterState;
  availableLetters: string[];
  onChange: (filters: SurnamesFilterState) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-muted">Show surnames whose display name begins with a specific letter.</p>
      <div>
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Quick pick</p>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Starting letter">
          <button
            type="button"
            onClick={() => onChange(withFilter(filters, { letter: null }))}
            className={cn(
              LETTER_CHIP,
              filters.letter === null
                ? "border-[#8b2e2e]/40 bg-[#f2ece4] text-heading"
                : "border-[#d8cfc0] bg-white text-heading hover:bg-[#f5f1ea]",
            )}
            aria-pressed={filters.letter === null}
          >
            All
          </button>
          {availableLetters.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onChange(withFilter(filters, { letter: l }))}
              className={cn(
                LETTER_CHIP,
                filters.letter === l
                  ? "border-[#8b2e2e]/40 bg-[#f2ece4] text-heading"
                  : "border-[#d8cfc0] bg-white text-heading hover:bg-[#f5f1ea]",
              )}
              aria-pressed={filters.letter === l}
              aria-label={l === SURNAME_LETTER_OTHER ? "Starts with number or symbol" : `Starts with ${l}`}
            >
              {l === SURNAME_LETTER_OTHER ? "#" : l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionDetail({
  filters,
  activeSection,
  availableLetters,
  onChange,
}: {
  filters: SurnamesFilterState;
  activeSection: SurnamesFilterSection;
  availableLetters: string[];
  onChange: (filters: SurnamesFilterState) => void;
}) {
  if (activeSection === "letter") {
    return <LetterSectionDetail filters={filters} availableLetters={availableLetters} onChange={onChange} />;
  }

  return (
    <ChoiceGroup
      label="People in tree"
      value={filters.rankFilter}
      onChange={(rankFilter) => onChange(withFilter(filters, { rankFilter }))}
      options={[
        { value: "all", label: "All surnames" },
        { value: "top10", label: "Top 10 (most people)" },
        { value: "bottom10", label: "Bottom 10 (fewest people)" },
      ]}
    />
  );
}

function LeftNavColumn({
  filters,
  activeSection,
  onSelectSection,
  onClearFilters,
  variant,
}: {
  filters: SurnamesFilterState;
  activeSection: SurnamesFilterSection;
  onSelectSection: (section: SurnamesFilterSection) => void;
  onClearFilters: () => void;
  variant: "panel" | "mobile-sheet";
}) {
  const minTouch = variant === "mobile-sheet";
  return (
    <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-border/30 px-4 py-5 sm:border-r sm:border-border/40 sm:pr-5">
      <FilterNavRow
        icon={CaseSensitive}
        label="Starting letter"
        summary={sectionSummary("letter", filters)}
        selected={activeSection === "letter"}
        onClick={() => onSelectSection("letter")}
        minTouch={minTouch}
      />
      <FilterNavRow
        icon={TrendingUp}
        label="Frequency rank"
        summary={sectionSummary("frequency", filters)}
        selected={activeSection === "frequency"}
        onClick={() => onSelectSection("frequency")}
        minTouch={minTouch}
      />
      <div className="mt-auto border-t border-[#ebe4d9] pt-4 sm:border-0 sm:pt-0">
        <button
          type="button"
          onClick={onClearFilters}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent py-2 font-body text-sm text-muted transition-colors hover:bg-black/[0.03] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:justify-start sm:px-1"
        >
          <RotateCcw size={16} className="shrink-0" aria-hidden />
          Clear all filters
        </button>
      </div>
    </aside>
  );
}

function FilterPanelFooter({
  onClose,
  onApplyFilter,
  className,
}: {
  onClose: () => void;
  onApplyFilter: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t border-[#ebe4d9] bg-[#f5f1ea] px-4 py-4 sm:flex-row sm:justify-end",
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-[#d8cfc0] bg-[#f5f1ea] font-body sm:w-auto"
        onClick={onClose}
      >
        Cancel
      </Button>
      <Button
        type="button"
        size="sm"
        className="w-full border-0 bg-[#8b2e2e] font-body text-white hover:bg-[#7a2828] sm:w-auto"
        onClick={onApplyFilter}
      >
        Apply filter
      </Button>
    </div>
  );
}

function RightDetailColumn({
  filters,
  activeSection,
  availableLetters,
  onChange,
  onClose,
  onApplyFilter,
}: {
  filters: SurnamesFilterState;
  activeSection: SurnamesFilterSection;
  availableLetters: string[];
  onChange: (filters: SurnamesFilterState) => void;
  onClose: () => void;
  onApplyFilter: () => void;
}) {
  const title = activeSection === "letter" ? "Starting letter" : "Frequency rank";

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-t border-[#ebe4d9] sm:border-t-0">
      <p className="shrink-0 px-4 pt-5 font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted sm:pl-5">
        {title}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:pl-5 sm:pr-1">
        <SectionDetail
          filters={filters}
          activeSection={activeSection}
          availableLetters={availableLetters}
          onChange={onChange}
        />
      </div>
      <FilterPanelFooter onClose={onClose} onApplyFilter={onApplyFilter} />
    </div>
  );
}

export function SurnamesFilterPanel({
  variant = "panel",
  filters,
  availableLetters,
  onChange,
  onClearFilters,
  onApplyFilter,
  onClose,
}: {
  variant?: "panel" | "mobile-sheet";
  filters: SurnamesFilterState;
  availableLetters: string[];
  onChange: (filters: SurnamesFilterState) => void;
  onClearFilters: () => void;
  onApplyFilter: () => void;
  onClose: () => void;
}) {
  const [activeSection, setActiveSection] = useState<SurnamesFilterSection>("letter");
  const [mobileStack, setMobileStack] = useState<"main" | SurnamesFilterSection>("main");

  const mobileTitles: Record<SurnamesFilterSection, string> = {
    letter: "Starting letter",
    frequency: "Frequency rank",
  };

  const openMobileSection = useCallback((section: SurnamesFilterSection) => {
    setActiveSection(section);
    setMobileStack(section);
  }, []);

  if (variant === "mobile-sheet") {
    if (mobileStack !== "main") {
      return (
        <div className="flex min-h-0 flex-1 flex-col bg-[#f5f1ea]">
          <div className="flex shrink-0 items-center gap-2 border-b border-[#e8e0d4] px-4 py-3">
            <button
              type="button"
              className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg px-2 font-body text-sm font-medium text-text transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              onClick={() => setMobileStack("main")}
            >
              <ChevronLeft size={20} aria-hidden />
              Back
            </button>
            <h2 className="min-w-0 flex-1 truncate text-center font-heading text-lg font-semibold text-heading">
              {mobileTitles[mobileStack]}
            </h2>
            <button
              type="button"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-black/[0.04] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              onClick={onClose}
              aria-label="Close filter"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            <SectionDetail
              filters={filters}
              activeSection={mobileStack}
              availableLetters={availableLetters}
              onChange={onChange}
            />
          </div>
          <FilterPanelFooter
            className="border-[#e8e0d4] p-4 sm:flex-col-reverse"
            onClose={onClose}
            onApplyFilter={onApplyFilter}
          />
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col bg-[#f5f1ea]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e8e0d4] px-4 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">Filter surnames</h2>
            <p className="mt-0.5 font-body text-xs text-muted">Narrow by starting letter or frequency rank.</p>
          </div>
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-black/[0.04] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            onClick={onClose}
            aria-label="Close filter"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="shrink-0 border-b border-[#ebe4d9] px-4 py-2">
          <ActiveSurnamesFilterChips filters={filters} onChange={onChange} compact />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <LeftNavColumn
            filters={filters}
            activeSection={activeSection}
            onSelectSection={openMobileSection}
            onClearFilters={onClearFilters}
            variant="mobile-sheet"
          />
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#e8e0d4] bg-[#f5f1ea] p-4">
          <Button
            type="button"
            variant="outline"
            className="h-12 min-h-[48px] border-[#d8cfc0] bg-[#f5f1ea] font-body text-sm shadow-none"
            onClick={onClearFilters}
          >
            Clear
          </Button>
          <Button
            type="button"
            className="h-12 min-h-[48px] border-0 bg-[#8b2e2e] font-body text-sm text-white shadow-none hover:bg-[#7a2828]"
            onClick={onApplyFilter}
          >
            Apply filter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-[min(90vh,720px)] min-h-[320px] flex-col overflow-hidden rounded-xl border border-[#e8e0d4] bg-white shadow-[0_16px_48px_-12px_rgba(55,40,28,0.18)]">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#ebe4d9] px-5 py-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">Filter surnames</h2>
          <p className="mt-0.5 font-body text-xs text-muted">Browse by starting letter or frequency rank.</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-black/[0.04] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          onClick={onClose}
          aria-label="Close filter"
        >
          <X size={20} aria-hidden />
        </button>
      </div>
      <div className="shrink-0 border-b border-[#ebe4d9] px-5 py-2">
        <ActiveSurnamesFilterChips filters={filters} onChange={onChange} />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden sm:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
        <LeftNavColumn
          filters={filters}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onClearFilters={onClearFilters}
          variant="panel"
        />
        <RightDetailColumn
          filters={filters}
          activeSection={activeSection}
          availableLetters={availableLetters}
          onChange={onChange}
          onClose={onClose}
          onApplyFilter={onApplyFilter}
        />
      </div>
    </div>
  );
}
