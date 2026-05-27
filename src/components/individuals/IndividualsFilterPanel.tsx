"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Baby,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  RotateCcw,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LifeStatusFilter = "all" | "living" | "dead";
export type GenderFilter = "all" | "male" | "female" | "unknown";
export type BooleanFilter = "all" | "yes" | "no";

export type IndividualsFilterState = {
  lifeStatus: LifeStatusFilter;
  gender: GenderFilter;
  minAge: string;
  maxAge: string;
  minBirthYear: string;
  maxBirthYear: string;
  minDeathYear: string;
  maxDeathYear: string;
  married: BooleanFilter;
  hasKids: BooleanFilter;
  deathCause: BooleanFilter;
};

type IndividualsFilterSection = "life" | "age" | "birth" | "death";

export const EMPTY_INDIVIDUALS_FILTERS: IndividualsFilterState = {
  lifeStatus: "all",
  gender: "all",
  minAge: "",
  maxAge: "",
  minBirthYear: "",
  maxBirthYear: "",
  minDeathYear: "",
  maxDeathYear: "",
  married: "all",
  hasKids: "all",
  deathCause: "all",
};

const SELECTED_ROW = "bg-[#f2ece4]";
const INPUT_CLASS =
  "min-h-[48px] w-full rounded-lg border border-[#d8cfc0] bg-white px-3 py-2.5 font-body text-base text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25";
const DATE_CHIP =
  "rounded-full border border-[#d8cfc0] bg-white px-3 py-1 font-body text-xs text-heading transition-colors hover:bg-[#f5f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function withFilter(
  filters: IndividualsFilterState,
  patch: Partial<IndividualsFilterState>,
): IndividualsFilterState {
  return { ...filters, ...patch };
}

export function hasActiveIndividualsFilters(filters: IndividualsFilterState): boolean {
  return (
    filters.lifeStatus !== "all" ||
    filters.gender !== "all" ||
    filters.minAge.trim() !== "" ||
    filters.maxAge.trim() !== "" ||
    filters.minBirthYear.trim() !== "" ||
    filters.maxBirthYear.trim() !== "" ||
    filters.minDeathYear.trim() !== "" ||
    filters.maxDeathYear.trim() !== "" ||
    filters.married !== "all" ||
    filters.hasKids !== "all" ||
    filters.deathCause !== "all"
  );
}

function activeFilterCount(filters: IndividualsFilterState): number {
  let count = 0;
  if (filters.lifeStatus !== "all") count++;
  if (filters.gender !== "all") count++;
  if (filters.minAge.trim() || filters.maxAge.trim()) count++;
  if (filters.minBirthYear.trim() || filters.maxBirthYear.trim()) count++;
  if (filters.minDeathYear.trim() || filters.maxDeathYear.trim()) count++;
  if (filters.married !== "all") count++;
  if (filters.hasKids !== "all") count++;
  if (filters.deathCause !== "all") count++;
  return count;
}

export function buildIndividualsFilterButtonLabel(filters: IndividualsFilterState): string {
  const count = activeFilterCount(filters);
  return count === 0 ? "Filter individuals" : `${count} filter${count === 1 ? "" : "s"} active`;
}

function rangeSummary(from: string, to: string, fallback: string): string {
  const start = from.trim();
  const end = to.trim();
  if (!start && !end) return fallback;
  if (start && end) return `${start} - ${end}`;
  if (start) return `From ${start}`;
  return `Until ${end}`;
}

function lifeSummary(filters: IndividualsFilterState): string {
  const parts = [
    filters.lifeStatus === "living" ? "Living" : filters.lifeStatus === "dead" ? "Deceased" : null,
    filters.gender === "male"
      ? "Male"
      : filters.gender === "female"
        ? "Female"
        : filters.gender === "unknown"
          ? "Unknown gender"
          : null,
    filters.married === "yes" ? "Married" : filters.married === "no" ? "Not married" : null,
    filters.hasKids === "yes" ? "Has kids" : filters.hasKids === "no" ? "No kids recorded" : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "No life filters";
}

function deathSummary(filters: IndividualsFilterState): string {
  const parts = [
    filters.deathCause === "yes"
      ? "Has cause of death"
      : filters.deathCause === "no"
        ? "No cause of death"
        : null,
    filters.minDeathYear.trim() || filters.maxDeathYear.trim()
      ? rangeSummary(filters.minDeathYear, filters.maxDeathYear, "")
      : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "No death filters";
}

function sectionSummary(section: IndividualsFilterSection, filters: IndividualsFilterState): string {
  if (section === "life") return lifeSummary(filters);
  if (section === "age") return rangeSummary(filters.minAge, filters.maxAge, "No age range");
  if (section === "birth") return rangeSummary(filters.minBirthYear, filters.maxBirthYear, "No birth range");
  return deathSummary(filters);
}

function FilterNavRow({
  icon: Icon,
  label,
  summary,
  selected,
  onClick,
  minTouch,
}: {
  icon: typeof Users;
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
            <button
              key={preset.label}
              type="button"
              className={DATE_CHIP}
              onClick={() => onChange(preset.from, preset.to)}
            >
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

function ActiveIndividualsFilterChips({
  filters,
  onChange,
  compact,
}: {
  filters: IndividualsFilterState;
  onChange: (filters: IndividualsFilterState) => void;
  compact?: boolean;
}) {
  const chips: ReactNode[] = [];
  const pushChip = (key: string, label: string, patch: Partial<IndividualsFilterState>) => {
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

  if (filters.lifeStatus !== "all") {
    pushChip("life", filters.lifeStatus === "living" ? "Living" : "Deceased", { lifeStatus: "all" });
  }
  if (filters.gender !== "all") {
    pushChip(
      "gender",
      filters.gender === "male" ? "Male" : filters.gender === "female" ? "Female" : "Unknown gender",
      { gender: "all" },
    );
  }
  if (filters.married !== "all") {
    pushChip("married", filters.married === "yes" ? "Married" : "Not married", { married: "all" });
  }
  if (filters.hasKids !== "all") {
    pushChip("kids", filters.hasKids === "yes" ? "Has kids" : "No kids recorded", { hasKids: "all" });
  }
  if (filters.minAge.trim() || filters.maxAge.trim()) {
    pushChip("age", `Age ${rangeSummary(filters.minAge, filters.maxAge, "")}`, { minAge: "", maxAge: "" });
  }
  if (filters.minBirthYear.trim() || filters.maxBirthYear.trim()) {
    pushChip("birth", `Born ${rangeSummary(filters.minBirthYear, filters.maxBirthYear, "")}`, {
      minBirthYear: "",
      maxBirthYear: "",
    });
  }
  if (filters.deathCause !== "all") {
    pushChip(
      "death-cause",
      filters.deathCause === "yes" ? "Has cause of death" : "No cause of death",
      { deathCause: "all" },
    );
  }
  if (filters.minDeathYear.trim() || filters.maxDeathYear.trim()) {
    pushChip("death-year", `Died ${rangeSummary(filters.minDeathYear, filters.maxDeathYear, "")}`, {
      minDeathYear: "",
      maxDeathYear: "",
    });
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

export function IndividualsActiveFilterChips({
  filters,
  onChange,
}: {
  filters: IndividualsFilterState;
  onChange: (filters: IndividualsFilterState) => void;
}) {
  if (!hasActiveIndividualsFilters(filters)) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <ActiveIndividualsFilterChips filters={filters} onChange={onChange} compact />
    </div>
  );
}

function LeftNavColumn({
  filters,
  activeSection,
  onSelectSection,
  onClearFilters,
  variant,
}: {
  filters: IndividualsFilterState;
  activeSection: IndividualsFilterSection;
  onSelectSection: (section: IndividualsFilterSection) => void;
  onClearFilters: () => void;
  variant: "panel" | "mobile-sheet";
}) {
  const minTouch = variant === "mobile-sheet";
  return (
    <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-border/30 px-4 py-5 sm:border-r sm:border-border/40 sm:pr-5">
      <div className="space-y-1">
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Life</p>
        <FilterNavRow
          icon={UserRound}
          label="Life details"
          summary={sectionSummary("life", filters)}
          selected={activeSection === "life"}
          onClick={() => onSelectSection("life")}
          minTouch={minTouch}
        />
      </div>
      <div className="space-y-1">
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Age</p>
        <FilterNavRow
          icon={Baby}
          label="Age range"
          summary={sectionSummary("age", filters)}
          selected={activeSection === "age"}
          onClick={() => onSelectSection("age")}
          minTouch={minTouch}
        />
      </div>
      <div className="space-y-1">
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Birth</p>
        <FilterNavRow
          icon={Calendar}
          label="Birth range"
          summary={sectionSummary("birth", filters)}
          selected={activeSection === "birth"}
          onClick={() => onSelectSection("birth")}
          minTouch={minTouch}
        />
      </div>
      <div className="space-y-1">
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Death</p>
        <FilterNavRow
          icon={Heart}
          label="Death details"
          summary={sectionSummary("death", filters)}
          selected={activeSection === "death"}
          onClick={() => onSelectSection("death")}
          minTouch={minTouch}
        />
      </div>
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

function SectionDetail({
  filters,
  activeSection,
  onChange,
}: {
  filters: IndividualsFilterState;
  activeSection: IndividualsFilterSection;
  onChange: (filters: IndividualsFilterState) => void;
}) {
  if (activeSection === "life") {
    return (
      <div className="space-y-5">
        <ChoiceGroup
          label="Living / deceased"
          value={filters.lifeStatus}
          onChange={(lifeStatus) => onChange(withFilter(filters, { lifeStatus }))}
          options={[
            { value: "all", label: "All people" },
            { value: "living", label: "Living" },
            { value: "dead", label: "Deceased" },
          ]}
        />
        <ChoiceGroup
          label="Gender"
          value={filters.gender}
          onChange={(gender) => onChange(withFilter(filters, { gender }))}
          options={[
            { value: "all", label: "Any gender" },
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "unknown", label: "Unknown / other" },
          ]}
        />
        <ChoiceGroup
          label="Married"
          value={filters.married}
          onChange={(married) => onChange(withFilter(filters, { married }))}
          options={[
            { value: "all", label: "Married or not" },
            { value: "yes", label: "Married" },
            { value: "no", label: "Not married" },
          ]}
        />
        <ChoiceGroup
          label="Children"
          value={filters.hasKids}
          onChange={(hasKids) => onChange(withFilter(filters, { hasKids }))}
          options={[
            { value: "all", label: "With or without kids" },
            { value: "yes", label: "Has kids" },
            { value: "no", label: "No kids recorded" },
          ]}
        />
      </div>
    );
  }

  if (activeSection === "age") {
    return (
      <RangeDetail
        title="Custom age range"
        from={filters.minAge}
        to={filters.maxAge}
        fromLabel="Minimum age"
        toLabel="Maximum age"
        fromPlaceholder="e.g. 18"
        toPlaceholder="e.g. 90"
        presets={[
          { label: "Children", from: "0", to: "17" },
          { label: "Adults", from: "18", to: "64" },
          { label: "65+", from: "65", to: "" },
          { label: "100+", from: "100", to: "" },
        ]}
        onChange={(minAge, maxAge) => onChange(withFilter(filters, { minAge, maxAge }))}
      />
    );
  }

  if (activeSection === "birth") {
    return (
      <RangeDetail
        title="Custom birth range"
        from={filters.minBirthYear}
        to={filters.maxBirthYear}
        fromLabel="From"
        toLabel="To"
        fromPlaceholder="e.g. 1900"
        toPlaceholder="e.g. 1950"
        presets={[
          { label: "1800s", from: "1800", to: "1899" },
          { label: "1900s", from: "1900", to: "1999" },
          { label: "Before 1900", from: "", to: "1899" },
          { label: "After 1950", from: "1950", to: "" },
        ]}
        onChange={(minBirthYear, maxBirthYear) => onChange(withFilter(filters, { minBirthYear, maxBirthYear }))}
      />
    );
  }

  return (
    <div className="space-y-5">
      <ChoiceGroup
        label="Cause of death"
        value={filters.deathCause}
        onChange={(deathCause) => onChange(withFilter(filters, { deathCause }))}
        options={[
          { value: "all", label: "With or without cause" },
          { value: "yes", label: "Has cause of death" },
          { value: "no", label: "No cause of death recorded" },
        ]}
      />
      <RangeDetail
        title="Custom death range"
        from={filters.minDeathYear}
        to={filters.maxDeathYear}
        fromLabel="From"
        toLabel="To"
        fromPlaceholder="e.g. 1900"
        toPlaceholder="e.g. 1980"
        presets={[
          { label: "1800s", from: "1800", to: "1899" },
          { label: "1900s", from: "1900", to: "1999" },
          { label: "Before 1950", from: "", to: "1949" },
          { label: "After 1950", from: "1950", to: "" },
        ]}
        onChange={(minDeathYear, maxDeathYear) => onChange(withFilter(filters, { minDeathYear, maxDeathYear }))}
      />
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
  filters: IndividualsFilterState;
  activeSection: IndividualsFilterSection;
  onChange: (filters: IndividualsFilterState) => void;
  onClose: () => void;
  onApplyFilter: () => void;
}) {
  const title =
    activeSection === "life"
      ? "Life details"
      : activeSection === "age"
        ? "Age range"
        : activeSection === "birth"
          ? "Birth range"
          : "Death details";

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-[#ebe4d9] px-4 py-5 sm:border-t-0 sm:pl-5">
      <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">{title}</p>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-0.5">
        <SectionDetail filters={filters} activeSection={activeSection} onChange={onChange} />
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 border-t border-[#ebe4d9] pt-4 sm:flex-row sm:justify-end">
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
    </div>
  );
}

export function IndividualsFilterPanel({
  variant = "panel",
  filters,
  onChange,
  onClearFilters,
  onApplyFilter,
  onClose,
}: {
  variant?: "panel" | "mobile-sheet";
  filters: IndividualsFilterState;
  onChange: (filters: IndividualsFilterState) => void;
  onClearFilters: () => void;
  onApplyFilter: () => void;
  onClose: () => void;
}) {
  const [activeSection, setActiveSection] = useState<IndividualsFilterSection>("life");
  const [mobileStack, setMobileStack] = useState<"main" | IndividualsFilterSection>("main");
  const shared = useMemo(
    () => ({
      filters,
      onChange,
      onClearFilters,
    }),
    [filters, onChange, onClearFilters],
  );
  const mobileTitles: Record<IndividualsFilterSection, string> = {
    life: "Life details",
    age: "Age range",
    birth: "Birth range",
    death: "Death range",
  };

  const openMobileSection = useCallback((section: IndividualsFilterSection) => {
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
            <SectionDetail filters={filters} activeSection={mobileStack} onChange={onChange} />
          </div>
          <div className="shrink-0 border-t border-[#e8e0d4] bg-[#f5f1ea] p-4">
            <Button
              type="button"
              className="h-12 min-h-[48px] w-full border-0 bg-[#8b2e2e] font-body text-sm text-white shadow-none hover:bg-[#7a2828]"
              onClick={onApplyFilter}
            >
              Apply filter
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col bg-[#f5f1ea]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e8e0d4] px-4 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">Filter individuals</h2>
            <p className="mt-0.5 font-body text-xs text-muted">Narrow the family tree by life, dates, and family.</p>
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
          <ActiveIndividualsFilterChips filters={filters} onChange={onChange} compact />
        </div>
        <LeftNavColumn
          {...shared}
          variant="mobile-sheet"
          activeSection={activeSection}
          onSelectSection={openMobileSection}
        />
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
    <div className="flex max-h-[min(90vh,800px)] flex-col overflow-hidden rounded-xl border border-[#e8e0d4] bg-white shadow-[0_16px_48px_-12px_rgba(55,40,28,0.18)]">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#ebe4d9] px-5 py-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">Filter individuals</h2>
          <p className="mt-0.5 font-body text-xs text-muted">Browse by life, age, birth, and death ranges.</p>
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
        <ActiveIndividualsFilterChips filters={filters} onChange={onChange} />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden sm:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
        <LeftNavColumn
          {...shared}
          variant="panel"
          activeSection={activeSection}
          onSelectSection={setActiveSection}
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
