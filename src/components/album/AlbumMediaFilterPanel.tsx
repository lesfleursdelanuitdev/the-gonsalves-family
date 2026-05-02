"use client";

import type { AlbumMediaLinkedIndividual, AlbumMediaLinkedPlace, MediaBucketKind } from "@ligneous/album-view";
import type { AlbumMediaDateRangeFilter, LinkedPlaceWithCount, LinkedTagWithCount } from "@/lib/album/album-media-filter-utils";
import {
  dateRangeFilterIsActive,
  formatAlbumLinkedPlaceLabel,
  summarizeDateRangeFilter,
} from "@/lib/album/album-media-filter-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AudioLines,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  ImageIcon,
  LayoutGrid,
  MapPin,
  MoreHorizontal,
  RotateCcw,
  Search,
  Tag,
  Users,
  Video,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";

export type AlbumMediaTypeFilter = "all" | MediaBucketKind;

export type AlbumMediaFilterSection = "people" | "date" | "place" | "tags";

export type AlbumMediaFilterPanelProps = {
  variant?: "panel" | "mobile-sheet";
  panelMediaType: AlbumMediaTypeFilter;
  panelSelectedPersonIds: string[];
  panelSelectedPlaceIds: string[];
  panelSelectedTagIds: string[];
  panelDateRange: AlbumMediaDateRangeFilter;
  mediaKindCounts: Record<MediaBucketKind, number>;
  totalAll: number;
  linked: AlbumMediaLinkedIndividual[];
  filteredPeople: AlbumMediaLinkedIndividual[];
  linkedPlaces: LinkedPlaceWithCount[];
  filteredPlaces: LinkedPlaceWithCount[];
  linkedTags: LinkedTagWithCount[];
  filteredTags: LinkedTagWithCount[];
  peopleSearchQuery: string;
  onPeopleSearchQueryChange: (q: string) => void;
  placeSearchQuery: string;
  onPlaceSearchQueryChange: (q: string) => void;
  tagSearchQuery: string;
  onTagSearchQueryChange: (q: string) => void;
  onPickType: (t: AlbumMediaTypeFilter) => void;
  onTogglePerson: (id: string) => void;
  onTogglePlace: (id: string) => void;
  onToggleTag: (id: string) => void;
  onDateRangeChange: (r: AlbumMediaDateRangeFilter) => void;
  onClearFilters: () => void;
  onApplyFilter: () => void;
  onClose: () => void;
};

const SELECTED_ROW = "bg-[#f2ece4]";

const PEOPLE_PICKER_SCROLL =
  "max-h-[min(20rem,48svh)] overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch] [touch-action:pan-y] sm:max-h-[min(24rem,52svh)]";

type TypeRow = {
  value: AlbumMediaTypeFilter;
  label: string;
  countKey?: MediaBucketKind;
  Icon: typeof LayoutGrid;
};

const TYPE_ROWS: TypeRow[] = [
  { value: "all", label: "All types", Icon: LayoutGrid },
  { value: "image", label: "Images", countKey: "image", Icon: ImageIcon },
  { value: "document", label: "Documents", countKey: "document", Icon: FileText },
  { value: "video", label: "Videos", countKey: "video", Icon: Video },
  { value: "audio", label: "Audio", countKey: "audio", Icon: AudioLines },
  { value: "other", label: "Other", countKey: "other", Icon: MoreHorizontal },
];

function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const a = parts[0][0];
  const b = parts[parts.length - 1][0];
  return `${a}${b}`.toUpperCase();
}

type Shared = Omit<AlbumMediaFilterPanelProps, "variant">;

function MediaTypeOptions({
  panelMediaType,
  mediaKindCounts,
  totalAll,
  onPickType,
  minTouch,
}: {
  panelMediaType: AlbumMediaTypeFilter;
  mediaKindCounts: Record<MediaBucketKind, number>;
  totalAll: number;
  onPickType: (t: AlbumMediaTypeFilter) => void;
  minTouch?: boolean;
}) {
  const rowPad = minTouch ? "min-h-[48px] px-3 py-2" : "px-2.5 py-2";
  return (
    <ul className="space-y-0.5" role="listbox" aria-label="Media type">
      {TYPE_ROWS.map((row) => {
        if (row.value !== "all" && row.countKey && mediaKindCounts[row.countKey] === 0) return null;
        const count = row.value === "all" ? totalAll : row.countKey ? mediaKindCounts[row.countKey] : 0;
        const selected = panelMediaType === row.value;
        const Icon = row.Icon;
        return (
          <li key={row.value}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onPickType(row.value)}
              className={`flex w-full items-center gap-2.5 rounded-lg text-left font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${rowPad} ${
                selected ? `${SELECTED_ROW} font-medium text-heading` : "text-text hover:bg-black/[0.03]"
              }`}
            >
              <Icon size={18} className="shrink-0 text-muted" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{row.label}</span>
              <span className="shrink-0 tabular-nums text-xs text-muted">{count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function peopleSummary(ids: string[], linked: AlbumMediaLinkedIndividual[]): string {
  if (ids.length === 0) return "No people selected";
  if (ids.length === 1) {
    const n = linked.find((p) => p.id === ids[0])?.displayName;
    return n ? `1 selected` : "1 selected";
  }
  return `${ids.length} selected`;
}

function placeSummary(ids: string[]): string {
  if (ids.length === 0) return "No place selected";
  if (ids.length === 1) return "1 selected";
  return `${ids.length} selected`;
}

function tagSummary(ids: string[]): string {
  if (ids.length === 0) return "No tags selected";
  if (ids.length === 1) return "1 selected";
  return `${ids.length} selected`;
}

function FilterNavRow({
  icon: Icon,
  label,
  summary,
  selected,
  onClick,
  minTouch,
  showChevron = true,
}: {
  icon: typeof Users;
  label: string;
  summary: string;
  selected: boolean;
  onClick: () => void;
  minTouch?: boolean;
  showChevron?: boolean;
}) {
  const pad = minTouch ? "min-h-[52px] px-1 py-2" : "px-1 py-2";
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg text-left font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          pad,
          selected ? `${SELECTED_ROW} text-heading` : "text-text hover:bg-black/[0.03]",
        )}
      >
        <Icon size={18} className="shrink-0 text-muted" aria-hidden />
        <span className="min-w-0 flex-1 font-medium">{label}</span>
        {showChevron ? <ChevronRight size={18} className="shrink-0 text-muted/80" aria-hidden /> : null}
      </button>
      <p className="pl-1 font-body text-xs leading-snug text-[#8b2e2e]/90">{summary}</p>
    </div>
  );
}

function ActiveFilterChips({
  panelSelectedPersonIds,
  linked,
  panelSelectedPlaceIds,
  places,
  panelSelectedTagIds,
  tags,
  panelDateRange,
  onTogglePerson,
  onTogglePlace,
  onToggleTag,
  onDateRangeChange,
  compact,
}: Pick<
  Shared,
  | "panelSelectedPersonIds"
  | "linked"
  | "panelSelectedPlaceIds"
  | "panelSelectedTagIds"
  | "panelDateRange"
  | "onTogglePerson"
  | "onTogglePlace"
  | "onToggleTag"
  | "onDateRangeChange"
> & {
  places: LinkedPlaceWithCount[];
  tags: LinkedTagWithCount[];
  compact?: boolean;
}) {
  const chips: ReactNode[] = [];
  for (const id of panelSelectedPersonIds) {
    const p = linked.find((x) => x.id === id);
    if (!p) continue;
    chips.push(
      <span
        key={`p-${id}`}
        className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#e5dccf] bg-[#faf7f2]/90 px-2 py-0.5 font-body text-[11px] text-heading shadow-sm"
      >
        <span className="min-w-0 truncate">{p.displayName}</span>
        <button
          type="button"
          className="shrink-0 rounded-full p-0.5 text-muted hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          onClick={() => onTogglePerson(id)}
          aria-label={`Remove ${p.displayName}`}
        >
          <X size={12} aria-hidden />
        </button>
      </span>,
    );
  }
  for (const id of panelSelectedPlaceIds) {
    const pl = places.find((x) => x.id === id);
    if (!pl) continue;
    const lab = formatAlbumLinkedPlaceLabel(pl);
    chips.push(
      <span
        key={`pl-${id}`}
        className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#e5dccf] bg-[#faf7f2]/90 px-2 py-0.5 font-body text-[11px] text-heading shadow-sm"
      >
        <span className="min-w-0 truncate">{lab}</span>
        <button
          type="button"
          className="shrink-0 rounded-full p-0.5 text-muted hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          onClick={() => onTogglePlace(id)}
          aria-label={`Remove ${lab}`}
        >
          <X size={12} aria-hidden />
        </button>
      </span>,
    );
  }
  for (const id of panelSelectedTagIds) {
    const t = tags.find((x) => x.id === id);
    if (!t) continue;
    chips.push(
      <span
        key={`t-${id}`}
        className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#e5dccf] bg-[#faf7f2]/90 px-2 py-0.5 font-body text-[11px] text-heading/90 shadow-sm"
      >
        <span className="min-w-0 truncate">{t.name}</span>
        <button
          type="button"
          className="shrink-0 rounded-full p-0.5 text-muted hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          onClick={() => onToggleTag(id)}
          aria-label={`Remove tag ${t.name}`}
        >
          <X size={12} aria-hidden />
        </button>
      </span>,
    );
  }
  if (dateRangeFilterIsActive(panelDateRange)) {
    const lab = summarizeDateRangeFilter(panelDateRange);
    chips.push(
      <span
        key="date"
        className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#e5dccf] bg-[#faf7f2]/90 px-2 py-0.5 font-body text-[11px] text-heading shadow-sm"
      >
        <span className="min-w-0 truncate">{lab}</span>
        <button
          type="button"
          className="shrink-0 rounded-full p-0.5 text-muted hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          onClick={() => onDateRangeChange({ from: "", to: "", includeUnknown: false })}
          aria-label="Remove date filter"
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
    <div
      className={cn("flex flex-wrap gap-1.5", compact ? "py-1" : "py-1.5")}
      role="list"
      aria-label="Active filters"
    >
      {chips}
    </div>
  );
}

function PeopleSearchField({
  peopleSearchQuery,
  onPeopleSearchQueryChange,
  comfortable,
}: Pick<Shared, "peopleSearchQuery" | "onPeopleSearchQueryChange"> & {
  comfortable?: boolean;
}) {
  return (
    <div className="relative">
      <Search
        size={comfortable ? 18 : 16}
        className="pointer-events-none absolute left-3 top-1/2 shrink-0 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={peopleSearchQuery}
        onChange={(e) => onPeopleSearchQueryChange(e.target.value)}
        placeholder="Search people…"
        className={
          comfortable
            ? "min-h-[48px] w-full rounded-lg border border-[#d8cfc0] bg-white py-3 pl-11 pr-3 font-body text-base text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
            : "w-full rounded-lg border border-[#d8cfc0] bg-[#faf8f4] py-2.5 pl-10 pr-3 font-body text-sm text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
        }
        autoComplete="off"
      />
    </div>
  );
}

function PlaceSearchField({
  placeSearchQuery,
  onPlaceSearchQueryChange,
  comfortable,
}: Pick<Shared, "placeSearchQuery" | "onPlaceSearchQueryChange"> & { comfortable?: boolean }) {
  return (
    <div className="relative">
      <Search
        size={comfortable ? 18 : 16}
        className="pointer-events-none absolute left-3 top-1/2 shrink-0 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={placeSearchQuery}
        onChange={(e) => onPlaceSearchQueryChange(e.target.value)}
        placeholder="Search places…"
        className={
          comfortable
            ? "min-h-[48px] w-full rounded-lg border border-[#d8cfc0] bg-white py-3 pl-11 pr-3 font-body text-base text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
            : "w-full rounded-lg border border-[#d8cfc0] bg-[#faf8f4] py-2.5 pl-10 pr-3 font-body text-sm text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
        }
        autoComplete="off"
      />
    </div>
  );
}

function TagSearchField({
  tagSearchQuery,
  onTagSearchQueryChange,
  comfortable,
}: Pick<Shared, "tagSearchQuery" | "onTagSearchQueryChange"> & { comfortable?: boolean }) {
  return (
    <div className="relative">
      <Search
        size={comfortable ? 18 : 16}
        className="pointer-events-none absolute left-3 top-1/2 shrink-0 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={tagSearchQuery}
        onChange={(e) => onTagSearchQueryChange(e.target.value)}
        placeholder="Search tags…"
        className={
          comfortable
            ? "min-h-[48px] w-full rounded-lg border border-[#d8cfc0] bg-white py-3 pl-11 pr-3 font-body text-base text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
            : "w-full rounded-lg border border-[#d8cfc0] bg-[#faf8f4] py-2.5 pl-10 pr-3 font-body text-sm text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
        }
        autoComplete="off"
      />
    </div>
  );
}

function PeopleResultsList({
  linked,
  filteredPeople,
  selectedSet,
  onTogglePerson,
  minTouch,
  className,
}: {
  linked: AlbumMediaLinkedIndividual[];
  filteredPeople: AlbumMediaLinkedIndividual[];
  selectedSet: Set<string>;
  onTogglePerson: (id: string) => void;
  minTouch: boolean;
  className?: string;
}) {
  const rowPad = minTouch ? "min-h-[52px] px-3 py-3" : "px-2 py-2.5";
  const ringSize = minTouch ? "size-6" : "size-5";
  const checkSize = minTouch ? 14 : 12;
  const avatarBox = minTouch ? "size-10" : "size-9";
  const initialsText = minTouch ? "text-xs" : "text-[11px]";
  const rowAlign = minTouch ? "items-center" : "items-start";
  const countPad = minTouch ? "" : "pt-0.5";
  const nameClass = minTouch
    ? "block font-body text-base font-semibold text-heading sm:text-sm"
    : "block font-body text-sm font-semibold text-heading";
  const radioWrap = minTouch
    ? "flex shrink-0 items-center justify-center"
    : "mt-0.5 flex shrink-0 items-center justify-center";

  if (linked.length === 0) {
    return <p className="font-body text-sm leading-relaxed text-muted">No linked people in this album.</p>;
  }
  if (filteredPeople.length === 0) {
    return null;
  }
  return (
    <ul className={className ?? "space-y-1"} role="listbox" aria-label="People in this album" aria-multiselectable="true">
      {filteredPeople.map((p) => {
        const selected = selectedSet.has(p.id);
        const count = p.mediaCount ?? 0;
        const showGedcomSecondary = p.gedcomName.trim() !== p.displayName.trim();
        return (
          <li key={p.id}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onTogglePerson(p.id)}
              className={`flex w-full ${rowAlign} gap-3 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${rowPad} ${
                selected ? SELECTED_ROW : "hover:bg-black/[0.025]"
              }`}
            >
              <span className={radioWrap} aria-hidden>
                {selected ? (
                  <span className={`flex ${ringSize} items-center justify-center rounded-full bg-[#8b2e2e]`}>
                    <Check size={checkSize} className="shrink-0 text-white" strokeWidth={2.5} aria-hidden />
                  </span>
                ) : (
                  <span className={`${ringSize} shrink-0 rounded-full border-2 border-[#c9bfb2] bg-white`} />
                )}
              </span>
              {p.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.thumbnailUrl}
                  alt=""
                  className={`${avatarBox} shrink-0 rounded-full object-cover ring-1 ring-black/[0.06]`}
                />
              ) : (
                <span
                  className={`flex ${avatarBox} shrink-0 items-center justify-center rounded-full bg-[#e8e0d4] font-body font-semibold text-muted ${initialsText}`}
                >
                  {initials(p.displayName)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className={nameClass}>{p.displayName}</span>
                {showGedcomSecondary ? (
                  <span className="mt-0.5 block font-mono text-[11px] leading-snug text-muted">{p.gedcomName}</span>
                ) : null}
              </span>
              <span className={`shrink-0 font-body text-xs tabular-nums text-muted ${countPad}`}>
                {count} item{count === 1 ? "" : "s"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PlaceResultsList({
  filteredPlaces,
  selectedSet,
  onTogglePlace,
  minTouch,
  className,
}: {
  filteredPlaces: LinkedPlaceWithCount[];
  selectedSet: Set<string>;
  onTogglePlace: (id: string) => void;
  minTouch: boolean;
  className?: string;
}) {
  const rowPad = minTouch ? "min-h-[52px] px-3 py-3" : "px-2 py-2.5";
  const ringSize = minTouch ? "size-6" : "size-5";
  const checkSize = minTouch ? 14 : 12;
  const rowAlign = minTouch ? "items-center" : "items-start";
  const radioWrap = minTouch
    ? "flex shrink-0 items-center justify-center"
    : "mt-0.5 flex shrink-0 items-center justify-center";

  if (filteredPlaces.length === 0) {
    return null;
  }
  return (
    <ul className={className ?? "space-y-1"} role="listbox" aria-label="Places in this album" aria-multiselectable="true">
      {filteredPlaces.map((p) => {
        const selected = selectedSet.has(p.id);
        const primary = formatAlbumLinkedPlaceLabel(p);
        const sub = [p.name, p.county, p.state, p.country].filter(Boolean).length > 0 ? (p.original ?? "").trim() : "";
        return (
          <li key={p.id}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onTogglePlace(p.id)}
              className={`flex w-full ${rowAlign} gap-3 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${rowPad} ${
                selected ? SELECTED_ROW : "hover:bg-black/[0.025]"
              }`}
            >
              <span className={radioWrap} aria-hidden>
                {selected ? (
                  <span className={`flex ${ringSize} items-center justify-center rounded-full bg-[#8b2e2e]`}>
                    <Check size={checkSize} className="shrink-0 text-white" strokeWidth={2.5} aria-hidden />
                  </span>
                ) : (
                  <span className={`${ringSize} shrink-0 rounded-full border-2 border-[#c9bfb2] bg-white`} />
                )}
              </span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ebe4d9] text-muted">
                <MapPin size={18} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-body text-sm font-semibold text-heading">{primary}</span>
                {sub ? <span className="mt-0.5 block font-mono text-[11px] leading-snug text-muted">{sub}</span> : null}
              </span>
              <span className="shrink-0 font-body text-xs tabular-nums text-muted">
                {p.mediaCount} item{p.mediaCount === 1 ? "" : "s"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function TagResultsList({
  filteredTags,
  selectedSet,
  onToggleTag,
  minTouch,
  className,
}: {
  filteredTags: LinkedTagWithCount[];
  selectedSet: Set<string>;
  onToggleTag: (id: string) => void;
  minTouch: boolean;
  className?: string;
}) {
  const rowPad = minTouch ? "min-h-[48px] px-3 py-2.5" : "px-2 py-2";
  if (filteredTags.length === 0) return null;
  return (
    <ul className={className ?? "space-y-0.5"} role="listbox" aria-label="Tags" aria-multiselectable="true">
      {filteredTags.map((t) => {
        const selected = selectedSet.has(t.id);
        return (
          <li key={t.id}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onToggleTag(t.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg text-left font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${rowPad} ${
                selected ? SELECTED_ROW : "text-text hover:bg-black/[0.02]"
              }`}
            >
              <Tag size={16} className="shrink-0 text-muted/80" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium text-heading/90">{t.name}</span>
              <span className="shrink-0 tabular-nums text-xs text-muted">
                {t.mediaCount} item{t.mediaCount === 1 ? "" : "s"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const DATE_CHIP =
  "rounded-full border border-[#d8cfc0] bg-white px-3 py-1 font-body text-xs text-heading transition-colors hover:bg-[#f5f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

function DateRangeDetail({
  value,
  onChange,
  comfortable,
}: {
  value: AlbumMediaDateRangeFilter;
  onChange: (r: AlbumMediaDateRangeFilter) => void;
  comfortable?: boolean;
}) {
  const applyPreset = useCallback(
    (preset: "unknown" | "1800s" | "1900s" | "1950-1980") => {
      if (preset === "unknown") {
        onChange({ from: "", to: "", includeUnknown: true });
        return;
      }
      if (preset === "1800s") onChange({ from: "1800", to: "1899", includeUnknown: false });
      if (preset === "1900s") onChange({ from: "1900", to: "1999", includeUnknown: false });
      if (preset === "1950-1980") onChange({ from: "1950", to: "1980", includeUnknown: false });
    },
    [onChange],
  );

  const inputClass = comfortable
    ? "min-h-[48px] w-full rounded-lg border border-[#d8cfc0] bg-white px-3 py-2.5 font-body text-base text-text outline-none focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
    : "w-full rounded-lg border border-[#d8cfc0] bg-[#faf8f4] px-3 py-2 font-body text-sm text-text outline-none focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25";

  return (
    <div className="space-y-4">
      <div>
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Quick ranges</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={DATE_CHIP} onClick={() => applyPreset("unknown")}>
            Unknown date
          </button>
          <button type="button" className={DATE_CHIP} onClick={() => applyPreset("1800s")}>
            1800s
          </button>
          <button type="button" className={DATE_CHIP} onClick={() => applyPreset("1900s")}>
            1900s
          </button>
          <button type="button" className={DATE_CHIP} onClick={() => applyPreset("1950-1980")}>
            1950–1980
          </button>
        </div>
      </div>
      <div>
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Custom range</p>
        <p className="mt-1 font-body text-[11px] leading-snug text-muted">
          Use year (e.g. <span className="font-mono">1950</span>), <span className="font-mono">1950-06</span>, or{" "}
          <span className="font-mono">1950-06-15</span>.
        </p>
        <div className={comfortable ? "mt-3 grid gap-3 sm:grid-cols-2" : "mt-2 grid gap-2 sm:grid-cols-2"}>
          <label className="block space-y-1">
            <span className="font-body text-xs text-muted">From</span>
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              value={value.from ?? ""}
              onChange={(e) => onChange({ ...value, from: e.target.value, includeUnknown: false })}
              placeholder="e.g. 1950"
              aria-label="Date from"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-body text-xs text-muted">To</span>
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              value={value.to ?? ""}
              onChange={(e) => onChange({ ...value, to: e.target.value, includeUnknown: false })}
              placeholder="e.g. 1980"
              aria-label="Date to"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function LeftNavColumn(
  props: Shared & {
    variant: "panel" | "mobile-sheet";
    activeSection: AlbumMediaFilterSection;
    onSelectSection: (s: AlbumMediaFilterSection) => void;
    /** When true, skip the Media type block (shown separately above on mobile). */
    omitMediaType?: boolean;
  },
) {
  const {
    panelMediaType,
    panelSelectedPersonIds,
    panelSelectedPlaceIds,
    panelSelectedTagIds,
    panelDateRange,
    mediaKindCounts,
    totalAll,
    linked,
    onPickType,
    onClearFilters,
    activeSection,
    onSelectSection,
    variant,
    omitMediaType,
  } = props;

  const minTouch = variant === "mobile-sheet";
  const pSum = peopleSummary(panelSelectedPersonIds, linked);
  const plSum = placeSummary(panelSelectedPlaceIds);
  const tSum = tagSummary(panelSelectedTagIds);
  const dSum = dateRangeFilterIsActive(panelDateRange) ? summarizeDateRangeFilter(panelDateRange) : "No date selected";

  return (
    <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-border/30 px-4 py-5 sm:border-r sm:border-border/40 sm:pr-5">
      {!omitMediaType ? (
        <div>
          <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Media type</p>
          <div className="mt-3">
            <MediaTypeOptions
              panelMediaType={panelMediaType}
              mediaKindCounts={mediaKindCounts}
              totalAll={totalAll}
              onPickType={onPickType}
              minTouch={minTouch}
            />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "space-y-1",
          !omitMediaType ? "border-t border-[#ebe4d9]/80 pt-4" : "pt-0",
        )}
      >
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">People</p>
        <FilterNavRow
          icon={Users}
          label="Select people"
          summary={pSum}
          selected={activeSection === "people"}
          onClick={() => onSelectSection("people")}
          minTouch={minTouch}
        />
      </div>

      <div className="space-y-1">
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Date</p>
        <FilterNavRow
          icon={Calendar}
          label="Date range"
          summary={dSum}
          selected={activeSection === "date"}
          onClick={() => onSelectSection("date")}
          minTouch={minTouch}
        />
      </div>

      <div className="space-y-1">
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Place</p>
        <FilterNavRow
          icon={MapPin}
          label="Select place"
          summary={plSum}
          selected={activeSection === "place"}
          onClick={() => onSelectSection("place")}
          minTouch={minTouch}
        />
      </div>

      <div className="space-y-1">
        <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Tags</p>
        <FilterNavRow
          icon={Tag}
          label="Select tags"
          summary={tSum}
          selected={activeSection === "tags"}
          onClick={() => onSelectSection("tags")}
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

function RightDetailColumn(
  props: Shared & {
    activeSection: AlbumMediaFilterSection;
    minTouch: boolean;
  },
) {
  const {
    activeSection,
    linked,
    filteredPeople,
    panelSelectedPersonIds,
    peopleSearchQuery,
    onPeopleSearchQueryChange,
    onTogglePerson,
    linkedPlaces,
    filteredPlaces,
    panelSelectedPlaceIds,
    placeSearchQuery,
    onPlaceSearchQueryChange,
    onTogglePlace,
    linkedTags,
    filteredTags,
    panelSelectedTagIds,
    tagSearchQuery,
    onTagSearchQueryChange,
    onToggleTag,
    panelDateRange,
    onDateRangeChange,
    onClose,
    onApplyFilter,
    minTouch,
  } = props;

  const selectedPeople = new Set(panelSelectedPersonIds);
  const selectedPlaces = new Set(panelSelectedPlaceIds);
  const selectedTags = new Set(panelSelectedTagIds);

  const title =
    activeSection === "people"
      ? "People in this album"
      : activeSection === "date"
        ? "Date range"
        : activeSection === "place"
          ? "Places in this album"
          : "Tags";

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-[#ebe4d9] px-4 py-5 sm:border-t-0 sm:pl-5">
      <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">{title}</p>

      {activeSection === "people" ? (
        <>
          <div className="mt-3">
            <PeopleSearchField
              peopleSearchQuery={peopleSearchQuery}
              onPeopleSearchQueryChange={onPeopleSearchQueryChange}
              comfortable={minTouch}
            />
          </div>
          <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
            {linked.length === 0 ? (
              <PeopleResultsList
                linked={linked}
                filteredPeople={filteredPeople}
                selectedSet={selectedPeople}
                onTogglePerson={onTogglePerson}
                minTouch={minTouch}
              />
            ) : filteredPeople.length === 0 ? (
              <p className="shrink-0 font-body text-sm leading-relaxed text-muted">
                No people found for &ldquo;{peopleSearchQuery.trim()}&rdquo;.
              </p>
            ) : (
              <div className={`min-h-0 flex-1 ${PEOPLE_PICKER_SCROLL}`}>
                <PeopleResultsList
                  linked={linked}
                  filteredPeople={filteredPeople}
                  selectedSet={selectedPeople}
                  onTogglePerson={onTogglePerson}
                  minTouch={minTouch}
                  className="space-y-1"
                />
              </div>
            )}
          </div>
        </>
      ) : null}

      {activeSection === "date" ? (
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-0.5">
          <DateRangeDetail value={panelDateRange} onChange={onDateRangeChange} comfortable={minTouch} />
        </div>
      ) : null}

      {activeSection === "place" ? (
        <>
          <div className="mt-3">
            <PlaceSearchField
              placeSearchQuery={placeSearchQuery}
              onPlaceSearchQueryChange={onPlaceSearchQueryChange}
              comfortable={minTouch}
            />
          </div>
          <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
            {linkedPlaces.length === 0 ? (
              <p className="font-body text-sm text-muted">No linked places in this album.</p>
            ) : filteredPlaces.length === 0 ? (
              <p className="font-body text-sm text-muted">No places match your search.</p>
            ) : (
              <div className={`min-h-0 flex-1 ${PEOPLE_PICKER_SCROLL}`}>
                <PlaceResultsList
                  filteredPlaces={filteredPlaces}
                  selectedSet={selectedPlaces}
                  onTogglePlace={onTogglePlace}
                  minTouch={minTouch}
                  className="space-y-1"
                />
              </div>
            )}
          </div>
        </>
      ) : null}

      {activeSection === "tags" ? (
        <>
          <div className="mt-3">
            <TagSearchField
              tagSearchQuery={tagSearchQuery}
              onTagSearchQueryChange={onTagSearchQueryChange}
              comfortable={minTouch}
            />
          </div>
          <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
            {linkedTags.length === 0 ? (
              <p className="font-body text-sm text-muted">No tags on media in this album.</p>
            ) : filteredTags.length === 0 ? (
              <p className="font-body text-sm text-muted">No tags match your search.</p>
            ) : (
              <div className={`min-h-0 flex-1 ${PEOPLE_PICKER_SCROLL}`}>
                <TagResultsList
                  filteredTags={filteredTags}
                  selectedSet={selectedTags}
                  onToggleTag={onToggleTag}
                  minTouch={minTouch}
                  className="space-y-0.5"
                />
              </div>
            )}
          </div>
        </>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 border-t border-[#ebe4d9] pt-4 sm:flex-row sm:items-center sm:justify-between">
        {activeSection === "people" || activeSection === "place" || activeSection === "tags" ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 self-start font-body text-xs text-muted underline-offset-2 hover:text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            onClick={() => {
              if (activeSection === "people" && peopleSearchQuery.trim()) onPeopleSearchQueryChange("");
              if (activeSection === "place" && placeSearchQuery.trim()) onPlaceSearchQueryChange("");
              if (activeSection === "tags" && tagSearchQuery.trim()) onTagSearchQueryChange("");
            }}
            aria-label="Clear search in this panel"
          >
            <HelpCircle size={14} className="shrink-0" aria-hidden />
            {activeSection === "people"
              ? "No people found?"
              : activeSection === "place"
                ? "No places found?"
                : "No tags found?"}
          </button>
        ) : (
          <span className="hidden min-h-[1.25rem] sm:block" aria-hidden />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
    </div>
  );
}

export function AlbumMediaFilterPanel({ variant = "panel", ...props }: AlbumMediaFilterPanelProps) {
  const [activeSection, setActiveSection] = useState<AlbumMediaFilterSection>("people");
  const [mobileStack, setMobileStack] = useState<"main" | AlbumMediaFilterSection>("main");

  const {
    panelMediaType,
    panelSelectedPersonIds,
    panelSelectedPlaceIds,
    panelSelectedTagIds,
    panelDateRange,
    mediaKindCounts,
    totalAll,
    linked,
    filteredPeople,
    peopleSearchQuery,
    onPeopleSearchQueryChange,
    placeSearchQuery,
    onPlaceSearchQueryChange,
    tagSearchQuery,
    onTagSearchQueryChange,
    linkedPlaces,
    filteredPlaces,
    linkedTags,
    filteredTags,
    onPickType,
    onTogglePerson,
    onTogglePlace,
    onToggleTag,
    onDateRangeChange,
    onClearFilters,
    onApplyFilter,
    onClose,
  } = props;

  const shared = props;

  const openMobileSection = useCallback((s: AlbumMediaFilterSection) => {
    setActiveSection(s);
    setMobileStack(s);
  }, []);

  const mobileBack = useCallback(() => {
    setMobileStack("main");
  }, []);

  const mobileTitles: Record<AlbumMediaFilterSection, string> = {
    people: "People in this album",
    date: "Date range",
    place: "Places in this album",
    tags: "Tags",
  };

  if (variant === "mobile-sheet") {
    if (mobileStack !== "main") {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#faf8f4]">
          <div className="flex shrink-0 items-center gap-2 border-b border-[#ebe4d9] px-3 py-2">
            <button
              type="button"
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-muted hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              onClick={mobileBack}
              aria-label="Back to filters"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
            <h3 className="min-w-0 flex-1 font-heading text-sm font-semibold tracking-tight text-heading">
              {mobileTitles[mobileStack]}
            </h3>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3">
            {mobileStack === "people" ? (
              <>
                <PeopleSearchField
                  peopleSearchQuery={peopleSearchQuery}
                  onPeopleSearchQueryChange={onPeopleSearchQueryChange}
                  comfortable
                />
                <div className="mt-3 min-h-0 flex-1 overflow-hidden">
                  {linked.length > 0 && filteredPeople.length === 0 ? (
                    <p className="font-body text-sm text-muted">No people found for &ldquo;{peopleSearchQuery.trim()}&rdquo;.</p>
                  ) : null}
                  {linked.length === 0 ? (
                    <PeopleResultsList
                      linked={linked}
                      filteredPeople={filteredPeople}
                      selectedSet={new Set(panelSelectedPersonIds)}
                      onTogglePerson={onTogglePerson}
                      minTouch
                    />
                  ) : filteredPeople.length === 0 ? null : (
                    <div className={`min-h-0 max-h-[min(50dvh,420px)] ${PEOPLE_PICKER_SCROLL}`}>
                      <PeopleResultsList
                        linked={linked}
                        filteredPeople={filteredPeople}
                        selectedSet={new Set(panelSelectedPersonIds)}
                        onTogglePerson={onTogglePerson}
                        minTouch
                        className="space-y-1"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : null}
            {mobileStack === "date" ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <DateRangeDetail value={panelDateRange} onChange={onDateRangeChange} comfortable />
              </div>
            ) : null}
            {mobileStack === "place" ? (
              <>
                <PlaceSearchField
                  placeSearchQuery={placeSearchQuery}
                  onPlaceSearchQueryChange={onPlaceSearchQueryChange}
                  comfortable
                />
                <div className="mt-3 min-h-0 flex-1 overflow-hidden">
                  {linkedPlaces.length === 0 ? (
                    <p className="font-body text-sm text-muted">No linked places in this album.</p>
                  ) : filteredPlaces.length === 0 ? (
                    <p className="font-body text-sm text-muted">No places match your search.</p>
                  ) : (
                    <div className={`min-h-0 max-h-[min(50dvh,420px)] ${PEOPLE_PICKER_SCROLL}`}>
                      <PlaceResultsList
                        filteredPlaces={filteredPlaces}
                        selectedSet={new Set(panelSelectedPlaceIds)}
                        onTogglePlace={onTogglePlace}
                        minTouch
                        className="space-y-1"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : null}
            {mobileStack === "tags" ? (
              <>
                <TagSearchField
                  tagSearchQuery={tagSearchQuery}
                  onTagSearchQueryChange={onTagSearchQueryChange}
                  comfortable
                />
                <div className="mt-3 min-h-0 flex-1 overflow-hidden">
                  {linkedTags.length === 0 ? (
                    <p className="font-body text-sm text-muted">No tags on media in this album.</p>
                  ) : filteredTags.length === 0 ? (
                    <p className="font-body text-sm text-muted">No tags match your search.</p>
                  ) : (
                    <div className={`min-h-0 max-h-[min(50dvh,420px)] ${PEOPLE_PICKER_SCROLL}`}>
                      <TagResultsList
                        filteredTags={filteredTags}
                        selectedSet={new Set(panelSelectedTagIds)}
                        onToggleTag={onToggleTag}
                        minTouch
                        className="space-y-0.5"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#faf8f4]">
        <div className="flex shrink-0 justify-center pt-2 pb-1" aria-hidden>
          <div className="h-1 w-11 rounded-full bg-[#c9bfb2]" />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#ebe4d9] px-4 pb-2 pt-1">
          <h2 className="font-heading text-base font-semibold tracking-tight text-heading">Filter media</h2>
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-black/[0.04] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            onClick={onClose}
            aria-label="Close filter"
          >
            <X size={22} className="shrink-0" aria-hidden />
          </button>
        </div>

        <div className="max-h-[min(220px,36svh)] shrink-0 overflow-y-auto overscroll-y-contain border-b border-[#ebe4d9]/80 px-4 py-3">
          <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Media type</p>
          <div className="mt-2">
            <MediaTypeOptions
              panelMediaType={panelMediaType}
              mediaKindCounts={mediaKindCounts}
              totalAll={totalAll}
              onPickType={onPickType}
              minTouch
            />
          </div>
        </div>

        <div className="shrink-0 border-b border-[#ebe4d9]/60 px-4 py-2">
          <ActiveFilterChips
            panelSelectedPersonIds={panelSelectedPersonIds}
            linked={linked}
            panelSelectedPlaceIds={panelSelectedPlaceIds}
            places={linkedPlaces}
            panelSelectedTagIds={panelSelectedTagIds}
            tags={linkedTags}
            panelDateRange={panelDateRange}
            onTogglePerson={onTogglePerson}
            onTogglePlace={onTogglePlace}
            onToggleTag={onToggleTag}
            onDateRangeChange={onDateRangeChange}
            compact
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <LeftNavColumn
            {...shared}
            variant="mobile-sheet"
            activeSection={activeSection}
            onSelectSection={openMobileSection}
            omitMediaType
          />
        </div>
      </div>
    );
  }

  const chipsBlock = useMemo(
    () => (
      <div className="border-b border-[#ebe4d9]/80 bg-[#fdfbf7] px-5 py-2">
        <ActiveFilterChips
          panelSelectedPersonIds={panelSelectedPersonIds}
          linked={linked}
          panelSelectedPlaceIds={panelSelectedPlaceIds}
          places={linkedPlaces}
          panelSelectedTagIds={panelSelectedTagIds}
          tags={linkedTags}
          panelDateRange={panelDateRange}
          onTogglePerson={onTogglePerson}
          onTogglePlace={onTogglePlace}
          onToggleTag={onToggleTag}
          onDateRangeChange={onDateRangeChange}
        />
      </div>
    ),
    [
      panelSelectedPersonIds,
      linked,
      panelSelectedPlaceIds,
      linkedPlaces,
      panelSelectedTagIds,
      linkedTags,
      panelDateRange,
      onTogglePerson,
      onTogglePlace,
      onToggleTag,
      onDateRangeChange,
    ],
  );

  return (
    <div className="flex max-h-[min(90vh,800px)] flex-col overflow-hidden rounded-xl border border-[#e8e0d4] bg-white shadow-[0_16px_48px_-12px_rgba(55,40,28,0.18)]">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#ebe4d9] px-5 py-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-heading">Filter media</h2>
        <button
          type="button"
          className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-black/[0.04] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          onClick={onClose}
          aria-label="Close filter"
        >
          <X size={20} className="shrink-0" aria-hidden />
        </button>
      </div>

      {chipsBlock}

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden sm:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
        <LeftNavColumn
          {...shared}
          variant="panel"
          activeSection={activeSection}
          onSelectSection={setActiveSection}
        />
        <RightDetailColumn {...shared} activeSection={activeSection} minTouch={false} />
      </div>
    </div>
  );
}
