"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Calendar,
  CalendarDays,
  CalendarHeart,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GenderFilter, LifeStatusFilter } from "@/components/individuals/IndividualsFilterPanel";
import {
  buildUpcomingAnniversariesFilterButtonLabel,
  createUpcomingAnniversariesFilters,
  hasActiveUpcomingAnniversariesFilters,
  daysSummary,
  monthsSummary,
  occasionTypesSummary,
  lifeDetailsSummary,
  toggleAnniversaryDay,
  toggleAnniversaryMonth,
  type AvailableAnniversaryDay,
  type AvailableAnniversaryMonth,
  type UpcomingAnniversariesFilterState,
} from "@/lib/upcoming-anniversaries/filter-upcoming-anniversaries";
import { cn } from "@/lib/utils";

export {
  buildUpcomingAnniversariesFilterButtonLabel,
  createUpcomingAnniversariesFilters,
  hasActiveUpcomingAnniversariesFilters,
  type UpcomingAnniversariesFilterState,
};

type FilterSection = "life" | "occasions" | "months" | "days";

const SELECTED_ROW = "bg-[#f2ece4]";

function withFilter(
  filters: UpcomingAnniversariesFilterState,
  patch: Partial<UpcomingAnniversariesFilterState>,
): UpcomingAnniversariesFilterState {
  return { ...filters, ...patch };
}

function FilterNavRow({
  icon: Icon,
  label,
  summary,
  selected,
  onClick,
  minTouch,
}: {
  icon: typeof CalendarHeart;
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

function OccasionTypeToggles({
  filters,
  onChange,
}: {
  filters: UpcomingAnniversariesFilterState;
  onChange: (filters: UpcomingAnniversariesFilterState) => void;
}) {
  const toggles = [
    { key: "birthdays" as const, label: "Birthdays" },
    { key: "deathAnniversaries" as const, label: "Death anniversaries" },
    { key: "marriageAnniversaries" as const, label: "Marriage anniversaries" },
  ];

  return (
    <div>
      <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Show</p>
      <div className="mt-2 space-y-1" role="group" aria-label="Occasion types">
        {toggles.map(({ key, label }) => {
          const selected = filters[key];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(withFilter(filters, { [key]: !selected }))}
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
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthToggles({
  filters,
  availableMonths,
  availableDays,
  onChange,
}: {
  filters: UpcomingAnniversariesFilterState;
  availableMonths: AvailableAnniversaryMonth[];
  availableDays: AvailableAnniversaryDay[];
  onChange: (filters: UpcomingAnniversariesFilterState) => void;
}) {
  return (
    <div>
      <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Show</p>
      <div className="mt-2 space-y-1" role="group" aria-label="Months">
        {availableMonths.map(({ month, label }) => {
          const selected = filters.enabledMonths.includes(month);
          return (
            <button
              key={month}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(toggleAnniversaryMonth(filters, month, availableDays))}
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
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function dayMatchesSearch(day: AvailableAnniversaryDay, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${day.label} ${day.monthLabel} ${day.month}/${day.day}`.toLowerCase();
  return haystack.includes(q);
}

function DayToggles({
  filters,
  availableDays,
  onChange,
}: {
  filters: UpcomingAnniversariesFilterState;
  availableDays: AvailableAnniversaryDay[];
  onChange: (filters: UpcomingAnniversariesFilterState) => void;
}) {
  const [daySearchQuery, setDaySearchQuery] = useState("");

  const filteredDays = useMemo(
    () => availableDays.filter((day) => dayMatchesSearch(day, daySearchQuery)),
    [availableDays, daySearchQuery],
  );

  const byMonth = useMemo(() => {
    const groups = new Map<string, AvailableAnniversaryDay[]>();
    for (const day of filteredDays) {
      const group = groups.get(day.monthLabel) ?? [];
      group.push(day);
      groups.set(day.monthLabel, group);
    }
    return groups;
  }, [filteredDays]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 shrink-0 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={daySearchQuery}
          onChange={(e) => setDaySearchQuery(e.target.value)}
          placeholder="Search days…"
          className="min-h-[48px] w-full rounded-lg border border-[#d8cfc0] bg-white py-3 pl-11 pr-3 font-body text-base text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
          autoComplete="off"
          aria-label="Search days in the upcoming window"
        />
      </div>

      {filteredDays.length === 0 ? (
        <p className="font-body text-sm text-muted">
          {daySearchQuery.trim() ? "No days match your search." : "No days in the upcoming window."}
        </p>
      ) : (
        <div className="space-y-5">
          {[...byMonth.entries()].map(([monthLabel, days]) => (
            <div key={monthLabel}>
              <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">
                {monthLabel}
              </p>
              <div className="mt-2 space-y-1" role="group" aria-label={`Days in ${monthLabel}`}>
                {days.map((day) => {
                  const selected = filters.enabledDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onChange(toggleAnniversaryDay(filters, day.key))}
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
                      <span>{day.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function ActiveFilterChips({
  filters,
  availableMonths,
  availableDays,
  onChange,
  compact,
}: {
  filters: UpcomingAnniversariesFilterState;
  availableMonths: AvailableAnniversaryMonth[];
  availableDays: AvailableAnniversaryDay[];
  onChange: (filters: UpcomingAnniversariesFilterState) => void;
  compact?: boolean;
}) {
  const chips: ReactNode[] = [];
  const pushChip = (key: string, label: string, patch: Partial<UpcomingAnniversariesFilterState>) => {
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

  if (!filters.birthdays) pushChip("birt", "Birthdays hidden", { birthdays: true });
  if (!filters.deathAnniversaries) pushChip("deat", "Death anniversaries hidden", { deathAnniversaries: true });
  if (!filters.marriageAnniversaries) {
    pushChip("marr", "Marriage anniversaries hidden", { marriageAnniversaries: true });
  }
  if (filters.lifeStatus !== "all") {
    pushChip("life", filters.lifeStatus === "living" ? "Living" : "Deceased", {
      lifeStatus: "all",
    });
  }
  if (filters.gender !== "all") {
    pushChip(
      "gender",
      filters.gender === "male" ? "Male" : filters.gender === "female" ? "Female" : "Unknown gender",
      { gender: "all" },
    );
  }


  const enabledDayKeys = new Set(filters.enabledDays);
  for (const day of availableDays) {
    if (!enabledDayKeys.has(day.key)) {
      pushChip(`day-${day.key}`, `${day.label} hidden`, {
        enabledDays: [...filters.enabledDays, day.key],
      });
    }
  }

  const enabled = new Set(filters.enabledMonths);
  for (const { month, label } of availableMonths) {
    if (!enabled.has(month)) {
      pushChip(`month-${month}`, `${label} hidden`, {
        enabledMonths: [...filters.enabledMonths, month].sort((a, b) => a - b),
      });
    }
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

export function UpcomingAnniversariesActiveFilterChips({
  filters,
  availableMonths,
  availableDays,
  onChange,
}: {
  filters: UpcomingAnniversariesFilterState;
  availableMonths: AvailableAnniversaryMonth[];
  availableDays: AvailableAnniversaryDay[];
  onChange: (filters: UpcomingAnniversariesFilterState) => void;
}) {
  const availableMonthNumbers = availableMonths.map((m) => m.month);
  const availableDayKeys = availableDays.map((d) => d.key);
  if (!hasActiveUpcomingAnniversariesFilters(filters, availableMonthNumbers, availableDayKeys)) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <ActiveFilterChips
        filters={filters}
        availableMonths={availableMonths}
        availableDays={availableDays}
        onChange={onChange}
        compact
      />
    </div>
  );
}

function LeftNavColumn({
  filters,
  availableMonths,
  availableDays,
  activeSection,
  onSelectSection,
  onClearFilters,
  variant,
}: {
  filters: UpcomingAnniversariesFilterState;
  availableMonths: AvailableAnniversaryMonth[];
  availableDays: AvailableAnniversaryDay[];
  activeSection: FilterSection;
  onSelectSection: (section: FilterSection) => void;
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
          summary={lifeDetailsSummary(filters)}
          selected={activeSection === "life"}
          onClick={() => onSelectSection("life")}
          minTouch={minTouch}
        />
      </div>
      <div className="space-y-1">
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Calendar</p>
        <FilterNavRow
          icon={Calendar}
          label="Months"
          summary={monthsSummary(filters, availableMonths)}
          selected={activeSection === "months"}
          onClick={() => onSelectSection("months")}
          minTouch={minTouch}
        />
      </div>
      <div className="space-y-1">
        <FilterNavRow
          icon={CalendarDays}
          label="Days"
          summary={daysSummary(filters, availableDays)}
          selected={activeSection === "days"}
          onClick={() => onSelectSection("days")}
          minTouch={minTouch}
        />
      </div>
      <div className="space-y-1">
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Occasions</p>
        <FilterNavRow
          icon={CalendarHeart}
          label="Occasion types"
          summary={occasionTypesSummary(filters)}
          selected={activeSection === "occasions"}
          onClick={() => onSelectSection("occasions")}
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
  availableMonths,
  availableDays,
  activeSection,
  onChange,
}: {
  filters: UpcomingAnniversariesFilterState;
  availableMonths: AvailableAnniversaryMonth[];
  availableDays: AvailableAnniversaryDay[];
  activeSection: FilterSection;
  onChange: (filters: UpcomingAnniversariesFilterState) => void;
}) {
  if (activeSection === "life") {
    return (
      <div className="space-y-5">
        <ChoiceGroup
          label="Living / deceased"
          value={filters.lifeStatus}
          onChange={(lifeStatus: LifeStatusFilter) => onChange(withFilter(filters, { lifeStatus }))}
          options={[
            { value: "all", label: "All people" },
            { value: "living", label: "Living" },
            { value: "dead", label: "Deceased" },
          ]}
        />
        <ChoiceGroup
          label="Gender"
          value={filters.gender}
          onChange={(gender: GenderFilter) => onChange(withFilter(filters, { gender }))}
          options={[
            { value: "all", label: "Any gender" },
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "unknown", label: "Unknown / other" },
          ]}
        />
        <p className="font-body text-xs leading-relaxed text-muted">
          Applies to birthdays and days of remembrance. Marriage anniversaries are always shown.
        </p>
      </div>
    );
  }

  if (activeSection === "occasions") {
    return <OccasionTypeToggles filters={filters} onChange={onChange} />;
  }

  if (activeSection === "months") {
    return (
      <MonthToggles
        filters={filters}
        availableMonths={availableMonths}
        availableDays={availableDays}
        onChange={onChange}
      />
    );
  }

  if (activeSection === "days") {
    return <DayToggles filters={filters} availableDays={availableDays} onChange={onChange} />;
  }

  return null;
}

function RightDetailColumn({
  filters,
  availableMonths,
  availableDays,
  activeSection,
  onChange,
  onClose,
  onApplyFilter,
}: {
  filters: UpcomingAnniversariesFilterState;
  availableMonths: AvailableAnniversaryMonth[];
  availableDays: AvailableAnniversaryDay[];
  activeSection: FilterSection;
  onChange: (filters: UpcomingAnniversariesFilterState) => void;
  onClose: () => void;
  onApplyFilter: () => void;
}) {
  const title =
    activeSection === "life"
      ? "Life details"
      : activeSection === "occasions"
        ? "Occasion types"
        : activeSection === "months"
          ? "Months"
          : "Days";

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-[#ebe4d9] px-4 py-5 sm:border-t-0 sm:pl-5">
      <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">{title}</p>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-0.5">
        <SectionDetail
          filters={filters}
          availableMonths={availableMonths}
          availableDays={availableDays}
          activeSection={activeSection}
          onChange={onChange}
        />
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

export function UpcomingAnniversariesFilterPanel({
  variant = "panel",
  filters,
  availableMonths,
  availableDays,
  onChange,
  onClearFilters,
  onApplyFilter,
  onClose,
}: {
  variant?: "panel" | "mobile-sheet";
  filters: UpcomingAnniversariesFilterState;
  availableMonths: AvailableAnniversaryMonth[];
  availableDays: AvailableAnniversaryDay[];
  onChange: (filters: UpcomingAnniversariesFilterState) => void;
  onClearFilters: () => void;
  onApplyFilter: () => void;
  onClose: () => void;
}) {
  const [activeSection, setActiveSection] = useState<FilterSection>("life");
  const [mobileStack, setMobileStack] = useState<"main" | FilterSection>("main");
  const shared = useMemo(
    () => ({
      filters,
      onChange,
      onClearFilters,
    }),
    [filters, onChange, onClearFilters],
  );
  const mobileTitles: Record<FilterSection, string> = {
    life: "Life details",
    occasions: "Occasion types",
    months: "Months",
    days: "Days",
  };

  const openMobileSection = useCallback((section: FilterSection) => {
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
            <SectionDetail filters={filters} availableMonths={availableMonths} availableDays={availableDays} activeSection={mobileStack} onChange={onChange} />
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
            <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">Filter anniversaries</h2>
            <p className="mt-0.5 font-body text-xs text-muted">Narrow by life, calendar dates, and occasion type.</p>
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
          <ActiveFilterChips filters={filters} availableMonths={availableMonths} availableDays={availableDays} onChange={onChange} compact />
        </div>
        <LeftNavColumn
          {...shared}
          availableMonths={availableMonths}
          availableDays={availableDays}
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
    <div className="flex min-h-[min(70vh,520px)] max-h-[min(90vh,800px)] flex-col overflow-hidden rounded-xl border border-[#e8e0d4] bg-white shadow-[0_16px_48px_-12px_rgba(55,40,28,0.18)]">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#ebe4d9] px-5 py-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">Filter anniversaries</h2>
          <p className="mt-0.5 font-body text-xs text-muted">Narrow by life, calendar dates, and occasion type.</p>
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
        <ActiveFilterChips filters={filters} availableMonths={availableMonths} availableDays={availableDays} onChange={onChange} />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden sm:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
        <LeftNavColumn
          {...shared}
          availableMonths={availableMonths}
          availableDays={availableDays}
          variant="panel"
          activeSection={activeSection}
          onSelectSection={setActiveSection}
        />
        <RightDetailColumn
          filters={filters}
          availableMonths={availableMonths}
          availableDays={availableDays}
          activeSection={activeSection}
          onChange={onChange}
          onClose={onClose}
          onApplyFilter={onApplyFilter}
        />
      </div>
    </div>
  );
}
