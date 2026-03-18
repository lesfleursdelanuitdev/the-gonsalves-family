"use client";

import { Baby, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Heart, HeartCrack, Skull, X } from "lucide-react";
import { Fragment, useState, useMemo, useEffect } from "react";
import { PersonNameLink } from "./PersonNameLink";
import { Section } from "./Section";
import {
  familyGridDataCellStyle,
  eventsDateCellStyle,
  eventsPaginationBarStyle,
  eventsPaginationButtonStyle,
  eventsFilterRowStyle,
  eventsFilterLabelStyle,
  eventsFilterSelectStyle,
  eventsFilterSelectButtonStyle,
  eventsFilterPillStyle,
  eventsFilterPillCloseStyle,
  SECTION_BORDER_RADIUS,
  noRowBorder,
  iconColor,
  iconSize,
} from "./styles";
import type { DetailEvent } from "./types";
import { EVENT_TYPE_LABELS } from "./utils";

const EVENTS_PAGE_SIZE = 5;

type BroadType = "all" | "birth" | "death" | "marriage" | "divorce";
type SpecificType = "all" | "self" | "spouse" | "child" | "parent" | "sibling" | "grandchild" | "grandparent";

function getEventBroad(e: DetailEvent): BroadType {
  if (e.eventType === "BIRT" || e.source === "childBirth" || e.source === "grandchildBirth") return "birth";
  if (
    e.eventType === "DEAT" ||
    e.source === "childDeath" ||
    e.source === "spouseDeath" ||
    e.source === "parentDeath" ||
    e.source === "siblingDeath" ||
    e.source === "grandparentDeath"
  )
    return "death";
  if ((e.source === "family" && e.eventType === "MARR") || e.source === "childMarriage") return "marriage";
  if (e.source === "family" && e.eventType === "DIV") return "divorce";
  return "birth"; // fallback for other individual events
}

function getEventSpecific(e: DetailEvent): SpecificType {
  if (e.source === "individual") return "self";
  if (e.source === "family") return "spouse";
  if (e.source === "childBirth" || e.source === "childDeath" || e.source === "childMarriage") return "child";
  if (e.source === "spouseDeath") return "spouse";
  if (e.source === "parentDeath") return "parent";
  if (e.source === "siblingDeath") return "sibling";
  if (e.source === "grandchildBirth") return "grandchild";
  if (e.source === "grandparentDeath") return "grandparent";
  return "self";
}

interface AppliedFilter {
  broad: BroadType;
  specific: SpecificType;
}

function filtersEqual(a: AppliedFilter, b: AppliedFilter): boolean {
  return a.broad === b.broad && a.specific === b.specific;
}

function eventMatchesFilter(e: DetailEvent, filter: AppliedFilter): boolean {
  const broad = getEventBroad(e);
  const specific = getEventSpecific(e);
  if (filter.broad !== "all" && filter.broad !== broad) return false;
  if (filter.specific !== "all" && filter.specific !== specific) return false;
  return true;
}

function eventMatchesAnyFilter(e: DetailEvent, filters: AppliedFilter[]): boolean {
  if (filters.length === 0) return true;
  return filters.some((f) => eventMatchesFilter(e, f));
}

const BROAD_OPTIONS: { value: BroadType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "birth", label: "Birth" },
  { value: "death", label: "Death" },
  { value: "marriage", label: "Marriage" },
  { value: "divorce", label: "Divorce" },
];

const SPECIFIC_OPTIONS: { value: SpecificType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "self", label: "Self" },
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "grandchild", label: "Grandchild" },
  { value: "grandparent", label: "Grandparent" },
];

function filterLabel(filter: AppliedFilter): string {
  const broad = BROAD_OPTIONS.find((o) => o.value === filter.broad)?.label ?? filter.broad;
  const specific = SPECIFIC_OPTIONS.find((o) => o.value === filter.specific)?.label ?? filter.specific;
  return `${broad} – ${specific}`;
}

interface EventsSectionProps {
  events: DetailEvent[];
  isMobile?: boolean;
}

function eventTypeLabel(e: DetailEvent): React.ReactNode {
  if (e.source === "childBirth" && e.childXref) {
    return <>Birth of <PersonNameLink xref={e.childXref} name={e.childName ?? null} /></>;
  }
  if (e.source === "childBirth") {
    return `Birth of ${e.childName ?? "Unknown"}`;
  }
  if (e.source === "childDeath" && e.childXref) {
    return <>Death of <PersonNameLink xref={e.childXref} name={e.childName ?? null} /></>;
  }
  if (e.source === "childDeath") {
    return `Death of ${e.childName ?? "Unknown"}`;
  }
  if (e.source === "spouseDeath" && e.spouseXref) {
    return <>Death of spouse <PersonNameLink xref={e.spouseXref} name={e.spouseName ?? null} /></>;
  }
  if (e.source === "spouseDeath") {
    return `Death of spouse ${e.spouseName ?? "Unknown"}`;
  }
  if (e.source === "parentDeath" && e.spouseXref) {
    return <>Death of parent <PersonNameLink xref={e.spouseXref} name={e.spouseName ?? null} /></>;
  }
  if (e.source === "parentDeath") {
    return `Death of parent ${e.spouseName ?? "Unknown"}`;
  }
  if (e.source === "siblingDeath" && e.childXref) {
    return <>Death of sibling <PersonNameLink xref={e.childXref} name={e.childName ?? null} /></>;
  }
  if (e.source === "siblingDeath") {
    return `Death of sibling ${e.childName ?? "Unknown"}`;
  }
  if (e.source === "grandchildBirth" && e.childXref) {
    return <>Birth of grandchild <PersonNameLink xref={e.childXref} name={e.childName ?? null} /></>;
  }
  if (e.source === "grandchildBirth") {
    return `Birth of grandchild ${e.childName ?? "Unknown"}`;
  }
  if (e.source === "grandparentDeath" && e.spouseXref) {
    return <>Death of grandparent <PersonNameLink xref={e.spouseXref} name={e.spouseName ?? null} /></>;
  }
  if (e.source === "grandparentDeath") {
    return `Death of grandparent ${e.spouseName ?? "Unknown"}`;
  }
  if (e.source === "childMarriage" && e.childXref && e.spouseXref) {
    return (
      <>
        Marriage of <PersonNameLink xref={e.childXref} name={e.childName ?? null} /> to <PersonNameLink xref={e.spouseXref} name={e.spouseName ?? null} />
      </>
    );
  }
  if (e.source === "childMarriage" && e.childXref) {
    return `Marriage of ${e.childName ?? "Unknown"} to ${e.spouseName ?? "Unknown"}`;
  }
  if (e.source === "childMarriage") {
    return `Marriage of ${e.childName ?? "Unknown"} to ${e.spouseName ?? "Unknown"}`;
  }
  if (e.source === "family" && e.eventType === "MARR" && e.spouseXref) {
    return <>Marriage to <PersonNameLink xref={e.spouseXref} name={e.spouseName ?? null} /></>;
  }
  if (e.source === "family" && e.eventType === "MARR") {
    return `Marriage to ${e.spouseName ?? "Unknown"}`;
  }
  if (e.source === "family" && e.eventType === "DIV" && e.spouseXref) {
    return <>Divorce from <PersonNameLink xref={e.spouseXref} name={e.spouseName ?? null} /></>;
  }
  if (e.source === "family" && e.eventType === "DIV") {
    return `Divorce from ${e.spouseName ?? "Unknown"}`;
  }
  return EVENT_TYPE_LABELS[e.eventType] ?? e.eventType;
}

export function EventsSection({ events, isMobile }: EventsSectionProps) {
  const [page, setPage] = useState(1);
  const [broadSelect, setBroadSelect] = useState<BroadType>("all");
  const [specificSelect, setSpecificSelect] = useState<SpecificType>("all");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);
  const [filterSectionOpen, setFilterSectionOpen] = useState(true);

  const filteredEvents = useMemo(
    () => events.filter((e) => eventMatchesAnyFilter(e, appliedFilters)),
    [events, appliedFilters]
  );
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PAGE_SIZE)),
    [filteredEvents.length]
  );
  const pageEvents = useMemo(
    () =>
      filteredEvents.slice(
        (page - 1) * EVENTS_PAGE_SIZE,
        page * EVENTS_PAGE_SIZE
      ),
    [filteredEvents, page]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);
  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  const candidateFilter: AppliedFilter = { broad: broadSelect, specific: specificSelect };
  const canAddFilter =
    appliedFilters.length === 0 || !appliedFilters.some((f) => filtersEqual(f, candidateFilter));

  const handleApplyFilter = () => {
    if (!canAddFilter) return;
    setAppliedFilters((prev) => [...prev, candidateFilter]);
  };
  const handleRemoveFilter = (index: number) => {
    setAppliedFilters((prev) => prev.filter((_, i) => i !== index));
    setPage(1);
  };

  if (events.length === 0) return null;

  const eventCountLabel = `${filteredEvents.length} ${filteredEvents.length === 1 ? "event" : "events"}`;
  const paginationBar = (
    <div style={eventsPaginationBarStyle} role="navigation" aria-label="Events pagination">
      <span style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#14532d" }}>{eventCountLabel}</span>
      <span style={{ color: "rgba(20, 83, 45, 0.5)" }}> · </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "#14532d" }}>
        Page {page} of {totalPages}
      </span>
      {totalPages > 1 && (
        <>
          <button
            type="button"
            style={eventsPaginationButtonStyle}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            type="button"
            style={eventsPaginationButtonStyle}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </>
      )}
    </div>
  );

  return (
    <Section
      icon={<CalendarDays size={iconSize} color={iconColor} aria-hidden />}
      title="Events"
      description="Life events for this person and close family—births, deaths, marriages, moves, military service, and more."
      descriptionStyle={{ paddingTop: 12 }}
      isMobile={isMobile}
      contentStyle={{
        padding: 0,
        borderBottomLeftRadius: SECTION_BORDER_RADIUS,
        borderBottomRightRadius: SECTION_BORDER_RADIUS,
      }}
    >
      <div style={{ padding: "8px 0 0 0" }}>
        <button
          type="button"
          onClick={() => setFilterSectionOpen((open) => !open)}
          aria-expanded={filterSectionOpen}
          aria-controls="events-filter-content"
          id="events-filter-toggle"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "calc(100% - 24px)",
            margin: 0,
            marginLeft: 12,
            marginRight: 12,
            marginBottom: 4,
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--crimson)",
            letterSpacing: "0.02em",
            backgroundColor: "color-mix(in srgb, var(--crimson) 3%, transparent)",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            boxSizing: "border-box",
          }}
        >
          <span>FILTER</span>
          {filterSectionOpen ? (
            <ChevronUp size={14} aria-hidden style={{ flexShrink: 0, marginLeft: 8 }} />
          ) : (
            <ChevronDown size={14} aria-hidden style={{ flexShrink: 0, marginLeft: 8 }} />
          )}
        </button>
        {filterSectionOpen && (
          <div id="events-filter-content" role="region" aria-labelledby="events-filter-toggle">
            <div style={eventsFilterRowStyle}>
              <span style={eventsFilterLabelStyle}>Type</span>
              <select
                value={broadSelect}
                onChange={(ev) => setBroadSelect(ev.target.value as BroadType)}
                style={eventsFilterSelectStyle}
                aria-label="Type"
              >
                {BROAD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={eventsFilterRowStyle}>
              <span style={eventsFilterLabelStyle}>Specific</span>
              <select
                value={specificSelect}
                onChange={(ev) => setSpecificSelect(ev.target.value as SpecificType)}
                style={eventsFilterSelectStyle}
                aria-label="Specific"
              >
                {SPECIFIC_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              style={eventsFilterSelectButtonStyle}
              onClick={handleApplyFilter}
              disabled={!canAddFilter}
            >
              Select
            </button>
            {appliedFilters.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                {appliedFilters.map((filter, index) => (
                  <span
                    key={`${filter.broad}-${filter.specific}-${index}`}
                    style={{
                      ...eventsFilterPillStyle,
                      marginLeft: index === 0 ? 12 : 0,
                      marginRight: index === appliedFilters.length - 1 ? 12 : 0,
                    }}
                  >
                    {filterLabel(filter)}
                    <button
                      type="button"
                      style={eventsFilterPillCloseStyle}
                      onClick={() => handleRemoveFilter(index)}
                      aria-label={`Remove filter ${filterLabel(filter)}`}
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 12,
          borderTop: "1px solid rgba(0, 0, 0, 0.06)",
          display: "grid",
          gridTemplateColumns: "minmax(5rem, auto) 1fr",
          gap: 0,
          fontSize: isMobile ? 13 : 14,
        }}
      >
        {pageEvents.map((e, i) => {
          const eventTypeLabelNode = eventTypeLabel(e);
          const date = e.dateOriginal?.trim() || null;
          const description = e.value?.trim() || null;
          const location = (e.placeOriginal ?? e.placeName)?.trim() || null;
          const sourceSuffix =
            e.source !== "individual" &&
            e.source !== "family" &&
            e.source !== "childBirth" &&
            e.source !== "childDeath" &&
            e.source !== "spouseDeath" &&
            e.source !== "childMarriage" &&
            e.source !== "parentDeath" &&
            e.source !== "siblingDeath" &&
            e.source !== "grandchildBirth" &&
            e.source !== "grandparentDeath"
              ? ` (${e.source})`
              : "";
          const contentParts: React.ReactNode[] = [eventTypeLabelNode];
          if (description) contentParts.push(description);
          if (location) contentParts.push(<em key="loc">{location}</em>);
          const contentWithSeparators = contentParts.reduce<React.ReactNode[]>(
            (acc, p) => (acc.length ? [...acc, " – ", p] : [p]),
            []
          );
          const isLastEvent = i === pageEvents.length - 1;
          const rowBorder = isLastEvent ? noRowBorder : {};
          const key = `${e.source}-${e.eventType}-${e.familyId ?? ""}-${e.childXref ?? ""}-${(page - 1) * EVENTS_PAGE_SIZE + i}`;
          const isBirth = e.eventType === "BIRT" || e.source === "childBirth" || e.source === "grandchildBirth";
          const isMarriage = (e.source === "family" && e.eventType === "MARR") || e.source === "childMarriage";
          const isDivorce = e.source === "family" && e.eventType === "DIV";
          const isDeath =
            e.eventType === "DEAT" ||
            e.source === "childDeath" ||
            e.source === "spouseDeath" ||
            e.source === "parentDeath" ||
            e.source === "siblingDeath" ||
            e.source === "grandparentDeath";
          const eventIconWrapStyle: React.CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(46, 122, 82, 0.05)",
            borderRadius: "50%",
            padding: 6,
            flexShrink: 0,
            marginRight: 8,
          };
          const eventIcon = isBirth ? (
            <span style={eventIconWrapStyle} aria-hidden>
              <Baby size={iconSize} color={iconColor} />
            </span>
          ) : isDeath ? (
            <span style={eventIconWrapStyle} aria-hidden>
              <Skull size={iconSize} color={iconColor} />
            </span>
          ) : isMarriage ? (
            <span style={eventIconWrapStyle} aria-hidden>
              <Heart size={iconSize} color={iconColor} />
            </span>
          ) : isDivorce ? (
            <span style={eventIconWrapStyle} aria-hidden>
              <HeartCrack size={iconSize} color={iconColor} />
            </span>
          ) : null;
          return (
            <Fragment key={key}>
              <div style={{ ...eventsDateCellStyle, ...rowBorder, fontWeight: 600 }}>
                {date ?? "—"}
              </div>
              <div
                style={{
                  ...familyGridDataCellStyle,
                  ...rowBorder,
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                }}
              >
                {eventIcon}
                <span style={{ flex: 1, minWidth: 0 }}>
                  {contentWithSeparators.map((node, k) => (
                    <Fragment key={k}>{node}</Fragment>
                  ))}
                  {sourceSuffix}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
      <div style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)" }}>{paginationBar}</div>
    </Section>
  );
}
