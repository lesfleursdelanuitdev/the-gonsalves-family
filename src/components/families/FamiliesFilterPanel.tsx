"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  CalendarHeart,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DivorcedStatus } from "./types";

export type BooleanFilter = "all" | "yes" | "no";
export type DivorcedFilter = "all" | DivorcedStatus;

export type FamiliesFilterState = {
  hasChildren: BooleanFilter;
  hasMarriageDate: BooleanFilter;
  divorced: DivorcedFilter;
  minChildren: string;
  maxChildren: string;
  minMarriageYear: string;
  maxMarriageYear: string;
};

type FamiliesFilterSection = "details" | "children" | "marriage";

export const EMPTY_FAMILIES_FILTERS: FamiliesFilterState = {
  hasChildren: "all",
  hasMarriageDate: "all",
  divorced: "all",
  minChildren: "",
  maxChildren: "",
  minMarriageYear: "",
  maxMarriageYear: "",
};

const SELECTED_ROW = "bg-[#f2ece4]";
const INPUT_CLASS =
  "min-h-[48px] w-full rounded-lg border border-[#d8cfc0] bg-white px-3 py-2.5 font-body text-base text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25";
const DATE_CHIP =
  "rounded-full border border-[#d8cfc0] bg-white px-3 py-1 font-body text-xs text-heading transition-colors hover:bg-[#f5f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function withFilter(filters: FamiliesFilterState, patch: Partial<FamiliesFilterState>): FamiliesFilterState {
  return { ...filters, ...patch };
}

export function hasActiveFamiliesFilters(filters: FamiliesFilterState): boolean {
  return (
    filters.hasChildren !== "all" ||
    filters.hasMarriageDate !== "all" ||
    filters.divorced !== "all" ||
    filters.minChildren.trim() !== "" ||
    filters.maxChildren.trim() !== "" ||
    filters.minMarriageYear.trim() !== "" ||
    filters.maxMarriageYear.trim() !== ""
  );
}

function activeFilterCount(filters: FamiliesFilterState): number {
  let count = 0;
  if (filters.hasChildren !== "all") count++;
  if (filters.hasMarriageDate !== "all") count++;
  if (filters.divorced !== "all") count++;
  if (filters.minChildren.trim() || filters.maxChildren.trim()) count++;
  if (filters.minMarriageYear.trim() || filters.maxMarriageYear.trim()) count++;
  return count;
}

export function buildFamiliesFilterButtonLabel(filters: FamiliesFilterState): string {
  const count = activeFilterCount(filters);
  return count === 0 ? "Filter families" : `${count} filter${count === 1 ? "" : "s"} active`;
}

function rangeSummary(from: string, to: string, fallback: string): string {
  const start = from.trim();
  const end = to.trim();
  if (!start && !end) return fallback;
  if (start && end) return `${start} - ${end}`;
  if (start) return `From ${start}`;
  return `Until ${end}`;
}

function detailsSummary(filters: FamiliesFilterState): string {
  const parts = [
    filters.hasChildren === "yes" ? "Has children" : filters.hasChildren === "no" ? "No children" : null,
    filters.hasMarriageDate === "yes"
      ? "Marriage date recorded"
      : filters.hasMarriageDate === "no"
        ? "No marriage date"
        : null,
    filters.divorced === "yes"
      ? "Divorced"
      : filters.divorced === "no"
        ? "Not divorced"
        : filters.divorced === "unknown"
          ? "Divorce unknown"
          : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "No family filters";
}

function sectionSummary(section: FamiliesFilterSection, filters: FamiliesFilterState): string {
  if (section === "details") return detailsSummary(filters);
  if (section === "children") return rangeSummary(filters.minChildren, filters.maxChildren, "No children range");
  return rangeSummary(filters.minMarriageYear, filters.maxMarriageYear, "No marriage year range");
}

function FilterNavRow({
  icon: Icon,
  label,
  summary,
  selected,
  onClick,
  minTouch,
}: {
  icon: typeof UsersRound;
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

function RangeDetail({
  title,
  from,
  to,
  fromLabel,
  toLabel,
  fromPlaceholder,
  toPlaceholder,
  presets,
  onChange,
}: {
  title: string;
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  fromPlaceholder: string;
  toPlaceholder: string;
  presets: { label: string; from: string; to: string }[];
  onChange: (from: string, to: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Quick ranges</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button key={preset.label} type="button" className={DATE_CHIP} onClick={() => onChange(preset.from, preset.to)}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">{title}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="font-body text-xs text-muted">{fromLabel}</span>
            <input
              type="number"
              inputMode="numeric"
              className={INPUT_CLASS}
              value={from}
              onChange={(event) => onChange(event.target.value, to)}
              placeholder={fromPlaceholder}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-body text-xs text-muted">{toLabel}</span>
            <input
              type="number"
              inputMode="numeric"
              className={INPUT_CLASS}
              value={to}
              onChange={(event) => onChange(from, event.target.value)}
              placeholder={toPlaceholder}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ActiveFamiliesFilterChips({
  filters,
  onChange,
  compact,
}: {
  filters: FamiliesFilterState;
  onChange: (filters: FamiliesFilterState) => void;
  compact?: boolean;
}) {
  const chips: ReactNode[] = [];
  const pushChip = (key: string, label: string, patch: Partial<FamiliesFilterState>) => {
    chips.push(
      <span
        key={key}
        className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#e5dccf] bg-[#faf7f2]/90 px-2 py-0.5 font-body text-[11px] text-heading shadow-sm"
      >
        <span className="min-w-0 truncate">{label}</span>
        <button
          type="button"
          className="shrink-0 rounded-full p-0.5 text-muted hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          onClick={() => onChange(withFilter(filters, patch))}
          aria-label={`Remove ${label}`}
        >
          <X size={12} aria-hidden />
        </button>
      </span>,
    );
  };

  if (filters.hasChildren !== "all") {
    pushChip("children-flag", filters.hasChildren === "yes" ? "Has children" : "No children", { hasChildren: "all" });
  }
  if (filters.hasMarriageDate !== "all") {
    pushChip("marriage-flag", filters.hasMarriageDate === "yes" ? "Marriage date" : "No marriage date", {
      hasMarriageDate: "all",
    });
  }
  if (filters.divorced !== "all") {
    const label =
      filters.divorced === "yes" ? "Divorced" : filters.divorced === "no" ? "Not divorced" : "Divorce unknown";
    pushChip("divorced", label, { divorced: "all" });
  }
  if (filters.minChildren.trim() || filters.maxChildren.trim()) {
    pushChip("children-range", `Children ${rangeSummary(filters.minChildren, filters.maxChildren, "")}`, {
      minChildren: "",
      maxChildren: "",
    });
  }
  if (filters.minMarriageYear.trim() || filters.maxMarriageYear.trim()) {
    pushChip("marriage-range", `Married ${rangeSummary(filters.minMarriageYear, filters.maxMarriageYear, "")}`, {
      minMarriageYear: "",
      maxMarriageYear: "",
    });
  }

  if (chips.length === 0) {
    return <p className={cn("font-body text-xs text-muted/70", compact ? "py-1" : "py-1.5")}>No active filters yet</p>;
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", compact ? "py-1" : "py-1.5")} role="list" aria-label="Active filters">
      {chips}
    </div>
  );
}

export function FamiliesActiveFilterChips({
  filters,
  onChange,
}: {
  filters: FamiliesFilterState;
  onChange: (filters: FamiliesFilterState) => void;
}) {
  if (!hasActiveFamiliesFilters(filters)) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <ActiveFamiliesFilterChips filters={filters} onChange={onChange} compact />
    </div>
  );
}

function SectionDetail({
  filters,
  activeSection,
  onChange,
}: {
  filters: FamiliesFilterState;
  activeSection: FamiliesFilterSection;
  onChange: (filters: FamiliesFilterState) => void;
}) {
  if (activeSection === "details") {
    return (
      <div className="space-y-5">
        <ChoiceGroup
          label="Children"
          value={filters.hasChildren}
          onChange={(hasChildren) => onChange(withFilter(filters, { hasChildren }))}
          options={[
            { value: "all", label: "With or without children" },
            { value: "yes", label: "Has children" },
            { value: "no", label: "No children recorded" },
          ]}
        />
        <ChoiceGroup
          label="Marriage date"
          value={filters.hasMarriageDate}
          onChange={(hasMarriageDate) => onChange(withFilter(filters, { hasMarriageDate }))}
          options={[
            { value: "all", label: "Any marriage date" },
            { value: "yes", label: "Marriage date recorded" },
            { value: "no", label: "No marriage date" },
          ]}
        />
        <ChoiceGroup
          label="Divorced"
          value={filters.divorced}
          onChange={(divorced) => onChange(withFilter(filters, { divorced }))}
          options={[
            { value: "all", label: "Any divorce status" },
            { value: "yes", label: "Divorced" },
            { value: "no", label: "Not divorced" },
            { value: "unknown", label: "Unknown" },
          ]}
        />
      </div>
    );
  }

  if (activeSection === "children") {
    return (
      <RangeDetail
        title="Number of children"
        from={filters.minChildren}
        to={filters.maxChildren}
        fromLabel="Minimum"
        toLabel="Maximum"
        fromPlaceholder="e.g. 1"
        toPlaceholder="e.g. 5"
        presets={[
          { label: "No children", from: "0", to: "0" },
          { label: "1-2", from: "1", to: "2" },
          { label: "3+", from: "3", to: "" },
          { label: "5+", from: "5", to: "" },
        ]}
        onChange={(minChildren, maxChildren) => onChange(withFilter(filters, { minChildren, maxChildren }))}
      />
    );
  }

  return (
    <RangeDetail
      title="Marriage year"
      from={filters.minMarriageYear}
      to={filters.maxMarriageYear}
      fromLabel="From year"
      toLabel="To year"
      fromPlaceholder="e.g. 1950"
      toPlaceholder="e.g. 1980"
      presets={[
        { label: "1800s", from: "1800", to: "1899" },
        { label: "1900s", from: "1900", to: "1999" },
        { label: "Before 1900", from: "", to: "1899" },
        { label: "After 1950", from: "1950", to: "" },
      ]}
      onChange={(minMarriageYear, maxMarriageYear) => onChange(withFilter(filters, { minMarriageYear, maxMarriageYear }))}
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
  filters: FamiliesFilterState;
  activeSection: FamiliesFilterSection;
  onSelectSection: (section: FamiliesFilterSection) => void;
  onClearFilters: () => void;
  variant: "panel" | "mobile-sheet";
}) {
  const minTouch = variant === "mobile-sheet";
  return (
    <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-border/30 px-4 py-5 sm:border-r sm:border-border/40 sm:pr-5">
      <FilterNavRow
        icon={UsersRound}
        label="Family details"
        summary={sectionSummary("details", filters)}
        selected={activeSection === "details"}
        onClick={() => onSelectSection("details")}
        minTouch={minTouch}
      />
      <FilterNavRow
        icon={UsersRound}
        label="Children count"
        summary={sectionSummary("children", filters)}
        selected={activeSection === "children"}
        onClick={() => onSelectSection("children")}
        minTouch={minTouch}
      />
      <FilterNavRow
        icon={CalendarHeart}
        label="Marriage year"
        summary={sectionSummary("marriage", filters)}
        selected={activeSection === "marriage"}
        onClick={() => onSelectSection("marriage")}
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
  onChange,
  onClose,
  onApplyFilter,
}: {
  filters: FamiliesFilterState;
  activeSection: FamiliesFilterSection;
  onChange: (filters: FamiliesFilterState) => void;
  onClose: () => void;
  onApplyFilter: () => void;
}) {
  const title =
    activeSection === "details" ? "Family details" : activeSection === "children" ? "Children count" : "Marriage year";

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-t border-[#ebe4d9] sm:border-t-0">
      <p className="shrink-0 px-4 pt-5 font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted sm:pl-5">
        {title}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:pl-5 sm:pr-1">
        <SectionDetail filters={filters} activeSection={activeSection} onChange={onChange} />
      </div>
      <FilterPanelFooter onClose={onClose} onApplyFilter={onApplyFilter} />
    </div>
  );
}

export function FamiliesFilterPanel({
  variant = "panel",
  filters,
  onChange,
  onClearFilters,
  onApplyFilter,
  onClose,
}: {
  variant?: "panel" | "mobile-sheet";
  filters: FamiliesFilterState;
  onChange: (filters: FamiliesFilterState) => void;
  onClearFilters: () => void;
  onApplyFilter: () => void;
  onClose: () => void;
}) {
  const [activeSection, setActiveSection] = useState<FamiliesFilterSection>("details");
  const [mobileStack, setMobileStack] = useState<"main" | FamiliesFilterSection>("main");

  const mobileTitles: Record<FamiliesFilterSection, string> = {
    details: "Family details",
    children: "Children count",
    marriage: "Marriage year",
  };

  const openMobileSection = useCallback((section: FamiliesFilterSection) => {
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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
            <SectionDetail filters={filters} activeSection={mobileStack} onChange={onChange} />
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
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#e8e0d4] px-4 py-3">
          <h2 className="font-heading text-lg font-semibold text-heading">Filter families</h2>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-black/[0.04] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            onClick={onClose}
            aria-label="Close filter"
          >
            <X size={20} aria-hidden />
          </button>
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
        <FilterPanelFooter
          className="border-[#e8e0d4] p-4"
          onClose={onClose}
          onApplyFilter={onApplyFilter}
        />
      </div>
    );
  }

  return (
    <div className="flex max-h-[min(90vh,720px)] min-h-[320px] flex-col overflow-hidden rounded-xl border border-[#e8e0d4] bg-[#f5f1ea] shadow-[0_18px_48px_rgba(60,45,25,0.14)]">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebe4d9] px-4 py-3">
        <h2 className="font-heading text-lg font-semibold text-heading">Filter families</h2>
        <button
          type="button"
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-black/[0.04] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          onClick={onClose}
          aria-label="Close filter"
        >
          <X size={18} aria-hidden />
        </button>
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
          onChange={onChange}
          onClose={onClose}
          onApplyFilter={onApplyFilter}
        />
      </div>
    </div>
  );
}
