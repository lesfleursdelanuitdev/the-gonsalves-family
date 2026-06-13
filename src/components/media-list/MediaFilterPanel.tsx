"use client";

import { type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type MediaFilterState, type MediaLinkFilter, type TriFilter } from "./types";

const SELECTED_ROW = "bg-[#f2ece4]";

const LINK_OPTIONS: { value: MediaLinkFilter; label: string }[] = [
  { value: "all", label: "Any link" },
  { value: "person", label: "Linked to a person" },
  { value: "family", label: "Linked to a family" },
  { value: "event", label: "Linked to an event" },
  { value: "place", label: "Linked to a place" },
  { value: "source", label: "Linked to a source" },
  { value: "unlinked", label: "Not linked to anything" },
];

const DESCRIPTION_OPTIONS: { value: TriFilter; label: string }[] = [
  { value: "all", label: "With or without a description" },
  { value: "yes", label: "Has a description" },
  { value: "no", label: "No description" },
];

const LINK_CHIP_LABEL: Record<Exclude<MediaLinkFilter, "all">, string> = {
  person: "Linked: person",
  family: "Linked: family",
  event: "Linked: event",
  place: "Linked: place",
  source: "Linked: source",
  unlinked: "Unlinked",
};

function withFilter(filters: MediaFilterState, patch: Partial<MediaFilterState>): MediaFilterState {
  return { ...filters, ...patch };
}

export function hasActiveMediaFilters(filters: MediaFilterState): boolean {
  return filters.linkedTo !== "all" || filters.hasDescription !== "all";
}

function activeFilterCount(filters: MediaFilterState): number {
  let count = 0;
  if (filters.linkedTo !== "all") count++;
  if (filters.hasDescription !== "all") count++;
  return count;
}

export function buildMediaFilterButtonLabel(filters: MediaFilterState, noun: string): string {
  const count = activeFilterCount(filters);
  return count === 0 ? `Filter ${noun}` : `${count} filter${count === 1 ? "" : "s"} active`;
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

function ActiveMediaFilterChipsInner({
  filters,
  onChange,
  compact,
}: {
  filters: MediaFilterState;
  onChange: (filters: MediaFilterState) => void;
  compact?: boolean;
}) {
  const chips: ReactNode[] = [];
  const pushChip = (key: string, label: string, patch: Partial<MediaFilterState>) => {
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

  if (filters.linkedTo !== "all") {
    pushChip("linked", LINK_CHIP_LABEL[filters.linkedTo], { linkedTo: "all" });
  }
  if (filters.hasDescription !== "all") {
    pushChip(
      "description",
      filters.hasDescription === "yes" ? "Has description" : "No description",
      { hasDescription: "all" },
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

export function MediaActiveFilterChips({
  filters,
  onChange,
}: {
  filters: MediaFilterState;
  onChange: (filters: MediaFilterState) => void;
}) {
  if (!hasActiveMediaFilters(filters)) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <ActiveMediaFilterChipsInner filters={filters} onChange={onChange} compact />
    </div>
  );
}

function PanelBody({
  filters,
  onChange,
}: {
  filters: MediaFilterState;
  onChange: (filters: MediaFilterState) => void;
}) {
  return (
    <div className="space-y-6">
      <ChoiceGroup
        label="Linked to"
        value={filters.linkedTo}
        options={LINK_OPTIONS}
        onChange={(linkedTo) => onChange(withFilter(filters, { linkedTo }))}
      />
      <ChoiceGroup
        label="Description"
        value={filters.hasDescription}
        options={DESCRIPTION_OPTIONS}
        onChange={(hasDescription) => onChange(withFilter(filters, { hasDescription }))}
      />
    </div>
  );
}

export function MediaFilterPanel({
  variant = "panel",
  noun,
  filters,
  onChange,
  onClearFilters,
  onApplyFilter,
  onClose,
}: {
  variant?: "panel" | "mobile-sheet";
  noun: string;
  filters: MediaFilterState;
  onChange: (filters: MediaFilterState) => void;
  onClearFilters: () => void;
  onApplyFilter: () => void;
  onClose: () => void;
}) {
  if (variant === "mobile-sheet") {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-[#f5f1ea]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e8e0d4] px-4 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">Filter {noun}</h2>
            <p className="mt-0.5 font-body text-xs text-muted">Narrow {noun} by what they show and their details.</p>
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
          <ActiveMediaFilterChipsInner filters={filters} onChange={onChange} compact />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <PanelBody filters={filters} onChange={onChange} />
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
    <div className="flex max-h-[min(90vh,800px)] flex-col overflow-hidden rounded-xl border border-[#e8e0d4] bg-white shadow-[0_16px_48px_-12px_rgba(55,40,28,0.18)]">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#ebe4d9] px-5 py-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">Filter {noun}</h2>
          <p className="mt-0.5 font-body text-xs text-muted">Browse by what each item is linked to.</p>
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
        <ActiveMediaFilterChipsInner filters={filters} onChange={onChange} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <PanelBody filters={filters} onChange={onChange} />
      </div>
      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#ebe4d9] px-5 py-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-[#d8cfc0] bg-[#f5f1ea] font-body sm:w-auto"
          onClick={onClearFilters}
        >
          Clear all
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
