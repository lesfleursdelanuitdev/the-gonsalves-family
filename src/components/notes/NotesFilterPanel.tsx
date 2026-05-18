"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Link2,
  RotateCcw,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildNotesFilterButtonLabel,
  EMPTY_NOTES_FILTERS,
  hasActiveNotesFilters,
  linkTypesSummary,
  notesLinkTypeLabel,
  peopleSummary,
  type NotesFilterState,
} from "@/lib/notes/filter-notes";
import type { PublicNoteLinkKind } from "@/lib/notes/public-note-types";
import { NotesPersonFilterSection } from "./NotesPersonFilterSection";
import { cn } from "@/lib/utils";

export {
  buildNotesFilterButtonLabel,
  EMPTY_NOTES_FILTERS,
  hasActiveNotesFilters,
  type NotesFilterState,
};

type NotesFilterSection = "link-types" | "people";

const SELECTED_ROW = "bg-[#f2ece4]";

const LINK_TYPE_ORDER: PublicNoteLinkKind[] = ["individual", "family", "event", "source"];

const LINK_TYPE_ICONS: Record<PublicNoteLinkKind, typeof UserRound> = {
  individual: UserRound,
  family: Home,
  event: CalendarDays,
  source: BookOpen,
};

function withFilter(filters: NotesFilterState, patch: Partial<NotesFilterState>): NotesFilterState {
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
  icon: typeof Link2;
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

function LinkTypeToggles({
  filters,
  onChange,
}: {
  filters: NotesFilterState;
  onChange: (filters: NotesFilterState) => void;
}) {
  return (
    <div>
      <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Show notes linked to</p>
      <p className="mt-1 font-body text-sm leading-relaxed text-muted">
        Turn types on or off. A note appears if it has at least one link of an enabled type.
      </p>
      <div className="mt-3 space-y-1" role="group" aria-label="Link types">
        {LINK_TYPE_ORDER.map((kind) => {
          const Icon = LINK_TYPE_ICONS[kind];
          const selected = filters.linkTypes[kind];
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onChange(
                  withFilter(filters, {
                    linkTypes: { ...filters.linkTypes, [kind]: !selected },
                  }),
                )
              }
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
              <Icon size={18} className="shrink-0 text-muted" aria-hidden />
              <span>{notesLinkTypeLabel(kind)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActiveNotesFilterChips({
  filters,
  onChange,
  compact,
}: {
  filters: NotesFilterState;
  onChange: (filters: NotesFilterState) => void;
  compact?: boolean;
}) {
  const chips: ReactNode[] = [];
  const pushChip = (key: string, label: string, patch: Partial<NotesFilterState>) => {
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

  if (filters.peopleMode === "selected") {
    pushChip("people-mode", "Filtered by people", { peopleMode: "all", selectedPeople: [] });
    for (const person of filters.selectedPeople) {
      pushChip(`person-${person.id}`, person.fullName, {
        selectedPeople: filters.selectedPeople.filter((p) => p.id !== person.id),
      });
    }
  }

  for (const kind of LINK_TYPE_ORDER) {
    if (!filters.linkTypes[kind]) {
      pushChip(`type-${kind}`, `${notesLinkTypeLabel(kind)} hidden`, {
        linkTypes: { ...filters.linkTypes, [kind]: true },
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

export function NotesActiveFilterChips({
  filters,
  onChange,
}: {
  filters: NotesFilterState;
  onChange: (filters: NotesFilterState) => void;
}) {
  if (!hasActiveNotesFilters(filters)) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <ActiveNotesFilterChips filters={filters} onChange={onChange} compact />
    </div>
  );
}

function SectionDetail({
  filters,
  activeSection,
  onChange,
}: {
  filters: NotesFilterState;
  activeSection: NotesFilterSection;
  onChange: (filters: NotesFilterState) => void;
}) {
  if (activeSection === "link-types") {
    return <LinkTypeToggles filters={filters} onChange={onChange} />;
  }

  return (
    <div className="space-y-5">
      <ChoiceGroup
        label="People filter"
        value={filters.peopleMode}
        onChange={(peopleMode) =>
          onChange(
            withFilter(filters, {
              peopleMode,
              selectedPeople: peopleMode === "all" ? [] : filters.selectedPeople,
            }),
          )
        }
        options={[
          { value: "all", label: "Show all people" },
          { value: "selected", label: "Filter by selected people" },
        ]}
      />
      {filters.peopleMode === "selected" ? (
        <NotesPersonFilterSection
          selected={filters.selectedPeople}
          onChange={(selectedPeople) => onChange(withFilter(filters, { selectedPeople }))}
        />
      ) : null}
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
  filters: NotesFilterState;
  activeSection: NotesFilterSection;
  onChange: (filters: NotesFilterState) => void;
  onClose: () => void;
  onApplyFilter: () => void;
}) {
  const title = activeSection === "link-types" ? "Link types" : "People";

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

function LeftNavColumn({
  filters,
  activeSection,
  onSelectSection,
  onClearFilters,
  variant,
}: {
  filters: NotesFilterState;
  activeSection: NotesFilterSection;
  onSelectSection: (section: NotesFilterSection) => void;
  onClearFilters: () => void;
  variant: "panel" | "mobile-sheet";
}) {
  const minTouch = variant === "mobile-sheet";
  return (
    <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-border/30 px-4 py-5 sm:border-r sm:border-border/40 sm:pr-5">
      <FilterNavRow
        icon={Link2}
        label="Link types"
        summary={linkTypesSummary(filters)}
        selected={activeSection === "link-types"}
        onClick={() => onSelectSection("link-types")}
        minTouch={minTouch}
      />
      <FilterNavRow
        icon={Users}
        label="People"
        summary={peopleSummary(filters)}
        selected={activeSection === "people"}
        onClick={() => onSelectSection("people")}
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

export function NotesFilterPanel({
  variant = "panel",
  filters,
  onChange,
  onClearFilters,
  onApplyFilter,
  onClose,
}: {
  variant?: "panel" | "mobile-sheet";
  filters: NotesFilterState;
  onChange: (filters: NotesFilterState) => void;
  onClearFilters: () => void;
  onApplyFilter: () => void;
  onClose: () => void;
}) {
  const [activeSection, setActiveSection] = useState<NotesFilterSection>("link-types");
  const [mobileStack, setMobileStack] = useState<"main" | NotesFilterSection>("main");

  const openMobileSection = useCallback((section: NotesFilterSection) => {
    setActiveSection(section);
    setMobileStack(section);
  }, []);

  const mobileTitles: Record<NotesFilterSection, string> = {
    "link-types": "Link types",
    people: "People",
  };

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
            <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">Filter notes</h2>
            <p className="mt-0.5 font-body text-xs text-muted">By link type and people in the tree.</p>
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
          <ActiveNotesFilterChips filters={filters} onChange={onChange} compact />
        </div>
        <LeftNavColumn
          filters={filters}
          activeSection={activeSection}
          onSelectSection={openMobileSection}
          onClearFilters={onClearFilters}
          variant="mobile-sheet"
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
          <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">Filter notes</h2>
          <p className="mt-0.5 font-body text-xs text-muted">By link type and people in the tree.</p>
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
        <ActiveNotesFilterChips filters={filters} onChange={onChange} />
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
