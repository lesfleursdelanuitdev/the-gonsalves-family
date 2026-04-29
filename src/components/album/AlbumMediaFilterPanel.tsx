"use client";

import type { AlbumMediaLinkedIndividual, MediaBucketKind } from "@ligneous/album-view";
import { Button } from "@/components/ui/button";
import {
  AudioLines,
  Check,
  FileText,
  HelpCircle,
  ImageIcon,
  LayoutGrid,
  MoreHorizontal,
  RotateCcw,
  Search,
  Video,
  X,
} from "lucide-react";

export type AlbumMediaTypeFilter = "all" | MediaBucketKind;

export type AlbumMediaFilterPanelProps = {
  /** `panel` = desktop two-column popover; `mobile-sheet` = bottom sheet body (sticky actions live outside). */
  variant?: "panel" | "mobile-sheet";
  panelMediaType: AlbumMediaTypeFilter;
  panelSelectedPersonIds: string[];
  mediaKindCounts: Record<MediaBucketKind, number>;
  totalAll: number;
  linked: AlbumMediaLinkedIndividual[];
  filteredPeople: AlbumMediaLinkedIndividual[];
  peopleSearchQuery: string;
  onPeopleSearchQueryChange: (q: string) => void;
  onPickType: (t: AlbumMediaTypeFilter) => void;
  /** Toggle membership in the people filter (OR semantics across selections). */
  onTogglePerson: (id: string) => void;
  onClearFilters: () => void;
  /** Apply / Done: on mobile commits drafts; on desktop closes popover (filters already live). */
  onApplyFilter: () => void;
  onClose: () => void;
};

const SELECTED_ROW = "bg-[#f2ece4]";

/** Scroll the people picker list; max-height keeps desktop popovers predictable. */
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

type SharedPanelFields = Omit<AlbumMediaFilterPanelProps, "variant">;

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

function PeopleChips({
  selectedPeopleOrdered,
  onTogglePerson,
  largeRemoveHitArea,
}: {
  selectedPeopleOrdered: AlbumMediaLinkedIndividual[];
  onTogglePerson: (id: string) => void;
  largeRemoveHitArea?: boolean;
}) {
  const removeBtnClass = largeRemoveHitArea
    ? "min-h-[44px] min-w-[44px] shrink-0 -m-2 flex items-center justify-center rounded-full p-2 text-muted hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    : "shrink-0 rounded-full p-0.5 text-muted hover:bg-black/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";
  return (
    <div className="flex min-h-[2.25rem] flex-wrap gap-1.5">
      {selectedPeopleOrdered.length === 0 ? (
        <span className="font-body text-xs text-muted/80">No people selected</span>
      ) : (
        selectedPeopleOrdered.map((person) => (
          <span
            key={person.id}
            className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#ddd5c8] bg-[#f7f3eb] font-body text-xs text-heading ${largeRemoveHitArea ? "px-2.5 py-1.5" : "px-2.5 py-1"}`}
          >
            <span className="min-w-0 truncate">{person.displayName}</span>
            <button
              type="button"
              className={removeBtnClass}
              onClick={() => onTogglePerson(person.id)}
              aria-label={`Remove ${person.displayName} from filter`}
            >
              <X size={14} className="shrink-0" aria-hidden />
            </button>
          </span>
        ))
      )}
    </div>
  );
}

function PeopleSearchField({
  peopleSearchQuery,
  onPeopleSearchQueryChange,
  comfortable,
}: Pick<SharedPanelFields, "peopleSearchQuery" | "onPeopleSearchQueryChange"> & {
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
    <ul
      className={className ?? "space-y-1"}
      role="listbox"
      aria-label="People in this album"
      aria-multiselectable="true"
    >
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

export function AlbumMediaFilterPanel({
  variant = "panel",
  ...props
}: AlbumMediaFilterPanelProps) {
  const {
    panelMediaType,
    panelSelectedPersonIds,
    mediaKindCounts,
    totalAll,
    linked,
    filteredPeople,
    peopleSearchQuery,
    onPeopleSearchQueryChange,
    onPickType,
    onTogglePerson,
    onClearFilters,
    onApplyFilter,
    onClose,
  } = props;

  const selectedSet = new Set(panelSelectedPersonIds);
  const selectedPeopleOrdered = panelSelectedPersonIds
    .map((id) => linked.find((p) => p.id === id))
    .filter((p): p is AlbumMediaLinkedIndividual => Boolean(p));

  if (variant === "mobile-sheet") {
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

        <div className="max-h-[min(240px,38svh)] shrink-0 overflow-y-auto overscroll-y-contain border-b border-[#ebe4d9]/80 px-4 py-3">
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

        <div className="shrink-0 space-y-2 border-b border-[#ebe4d9]/80 px-4 py-3">
          <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">People</p>
          <PeopleChips
            selectedPeopleOrdered={selectedPeopleOrdered}
            onTogglePerson={onTogglePerson}
            largeRemoveHitArea
          />
        </div>

        <div className="shrink-0 space-y-2 bg-[#faf8f4] px-4 pb-2 pt-3">
          <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">
            People in this album
          </p>
          <PeopleSearchField
            peopleSearchQuery={peopleSearchQuery}
            onPeopleSearchQueryChange={onPeopleSearchQueryChange}
            comfortable
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-2 pt-1">
          {linked.length > 0 && filteredPeople.length === 0 ? (
            <p className="shrink-0 font-body text-sm leading-relaxed text-muted">
              No people found for &ldquo;{peopleSearchQuery.trim()}&rdquo;.
            </p>
          ) : null}
          {linked.length === 0 ? (
            <div className="shrink-0">
              <PeopleResultsList
                linked={linked}
                filteredPeople={filteredPeople}
                selectedSet={selectedSet}
                onTogglePerson={onTogglePerson}
                minTouch
              />
            </div>
          ) : filteredPeople.length === 0 ? null : (
            <div className={`min-h-0 flex-1 ${PEOPLE_PICKER_SCROLL}`}>
              <PeopleResultsList
                linked={linked}
                filteredPeople={filteredPeople}
                selectedSet={selectedSet}
                onTogglePerson={onTogglePerson}
                minTouch
                className="space-y-1"
              />
            </div>
          )}
          <button
            type="button"
            className="mt-2 inline-flex shrink-0 items-center gap-1.5 font-body text-xs text-muted underline-offset-2 hover:text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            onClick={() => {
              if (peopleSearchQuery.trim()) onPeopleSearchQueryChange("");
            }}
            aria-label="Clear search to see all people in this album"
          >
            <HelpCircle size={14} className="shrink-0" aria-hidden />
            No people found?
          </button>
        </div>
      </div>
    );
  }

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

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden sm:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto border-border/30 px-4 py-5 sm:border-r sm:border-border/40 sm:pr-5">
          <div>
            <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">Media type</p>
            <div className="mt-3">
              <MediaTypeOptions
                panelMediaType={panelMediaType}
                mediaKindCounts={mediaKindCounts}
                totalAll={totalAll}
                onPickType={onPickType}
              />
            </div>
          </div>

          <div>
            <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">People</p>
            <div className="mt-2">
              <PeopleChips selectedPeopleOrdered={selectedPeopleOrdered} onTogglePerson={onTogglePerson} />
            </div>
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

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-[#ebe4d9] px-4 py-5 sm:border-t-0 sm:pl-5">
          <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">
            People in this album
          </p>

          <div className="mt-3">
            <PeopleSearchField
              peopleSearchQuery={peopleSearchQuery}
              onPeopleSearchQueryChange={onPeopleSearchQueryChange}
            />
          </div>

          <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
            {linked.length === 0 ? (
              <div className="shrink-0">
                <PeopleResultsList
                  linked={linked}
                  filteredPeople={filteredPeople}
                  selectedSet={selectedSet}
                  onTogglePerson={onTogglePerson}
                  minTouch={false}
                />
              </div>
            ) : filteredPeople.length === 0 ? (
              <p className="shrink-0 font-body text-sm leading-relaxed text-muted">
                No people found for &ldquo;{peopleSearchQuery.trim()}&rdquo;.
              </p>
            ) : (
              <div className={`min-h-0 flex-1 ${PEOPLE_PICKER_SCROLL}`}>
                <PeopleResultsList
                  linked={linked}
                  filteredPeople={filteredPeople}
                  selectedSet={selectedSet}
                  onTogglePerson={onTogglePerson}
                  minTouch={false}
                  className="space-y-1"
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-[#ebe4d9] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 self-start font-body text-xs text-muted underline-offset-2 hover:text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              onClick={() => {
                if (peopleSearchQuery.trim()) onPeopleSearchQueryChange("");
              }}
              aria-label="Clear search to see all people in this album"
            >
              <HelpCircle size={14} className="shrink-0" aria-hidden />
              No people found?
            </button>
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
      </div>
    </div>
  );
}
