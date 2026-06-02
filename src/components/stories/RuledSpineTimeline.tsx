"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {
  formatEventDate,
  friendlyTimelineDescription,
  typeLabel,
} from "@ligneous/timeline-view";
import type { IndividualDetailEvent, TimelineSubject } from "@ligneous/timeline-view";
import "./timeline.css";

/* Markdown rendered inside event descriptions (bold, italic, links, lists). */
const BODY_MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

function MarkdownBody({ text, className }: { text: string; className: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]} skipHtml components={BODY_MARKDOWN_COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

/* ── Event → display mapping ──────────────────────────────────────────────── */

type Category =
  | "birth"
  | "residence"
  | "education"
  | "marriage"
  | "work"
  | "migration"
  | "milestone"
  | "death";

const CATEGORY_VAR: Record<Category, string> = {
  birth: "var(--cat-birth)",
  residence: "var(--cat-residence)",
  education: "var(--cat-education)",
  marriage: "var(--cat-marriage)",
  work: "var(--cat-work)",
  migration: "var(--cat-migration)",
  milestone: "var(--cat-milestone)",
  death: "var(--cat-death)",
};

function categoryOf(eventType: string): Category {
  switch ((eventType ?? "").toUpperCase()) {
    case "BIRT":
    case "BAPM":
    case "CHR":
    case "CHRA":
      return "birth";
    case "DEAT":
    case "BURI":
    case "CREM":
      return "death";
    case "MARR":
    case "ENGA":
      return "marriage";
    case "RESI":
    case "PROP":
      return "residence";
    case "OCCU":
      return "work";
    case "EDUC":
    case "GRAD":
      return "education";
    case "EMIG":
    case "IMMI":
    case "NATU":
      return "migration";
    default:
      return "milestone";
  }
}

const FAMILY_SOURCES = new Set([
  "family",
  "familyRecord",
  "member",
  "spouseBirth",
  "spouseDeath",
  "childBirth",
  "childDeath",
  "childMarriage",
  "grandchildBirth",
  "grandchildDeath",
  "grandchildOfChild",
  "parentDeath",
  "siblingDeath",
  "grandparentDeath",
]);

function parseYear(dateOriginal: string | null | undefined): string | null {
  const m = String(dateOriginal ?? "").match(/\b(\d{4})\b/);
  return m ? m[1] : null;
}

type DisplayEvent = {
  key: string;
  year: string;
  numericYear: number | null;
  date: string;
  tagLabel: string | null;
  category: Category;
  catVar: string;
  title: string | null;
  place: string | null;
  body: string | null;
  imageSrc: string | null;
};

/** Bare "Custom" / "Event" placeholders carry no meaning — never surface them. */
function isPlaceholderLabel(s: string | null | undefined): boolean {
  return /^(cust|custom|even|event)$/i.test((s ?? "").trim());
}

function mapEvent(
  e: IndividualDetailEvent,
  index: number,
  subject: TimelineSubject,
  resolveImageSrc: (ref: string) => string | null,
): DisplayEvent {
  const et = (e.eventType ?? "").toUpperCase();
  const isCustom = et === "CUST" || et === "EVEN";
  const emptyCustom = isCustom && !e.customType?.trim() && !e.eventLabel?.trim();

  const category = categoryOf(e.eventType);
  const base = typeLabel(e); // customType for custom events with a type, else the GEDCOM label
  const relatedName = (e.childName ?? e.spouseName ?? "").trim();
  const tagLabel = emptyCustom
    ? null
    : FAMILY_SOURCES.has(e.source) && relatedName
      ? `${base} · ${relatedName}`
      : base;

  // Title: explicit label → custom type → friendly headline → type label.
  // The friendly headline renders "Custom of …" for custom events, so bypass it there.
  let title: string | null;
  if (e.eventLabel?.trim()) title = e.eventLabel.trim();
  else if (isCustom && e.customType?.trim()) title = base;
  else title = friendlyTimelineDescription(e, subject) || base;
  if (emptyCustom || isPlaceholderLabel(title)) title = null;

  // Description: narrative value, or cause when no friendly headline already carries it.
  const value = e.value?.trim();
  const cause = e.cause?.trim();
  const body = value || (e.eventLabel?.trim() ? cause : "") || null;

  const place = (e.placeName ?? e.placeOriginal ?? "").trim() || null;

  const ref = e.previewMediaFileRef?.trim();
  const imageSrc = ref ? resolveImageSrc(ref) : null;

  const numericYear = e.year ?? (parseYear(e.dateOriginal) ? Number(parseYear(e.dateOriginal)) : null);

  return {
    key: e.eventId ?? `${e.source}:${e.eventType}:${index}`,
    year: e.year != null ? String(e.year) : parseYear(e.dateOriginal) ?? "—",
    numericYear: Number.isFinite(numericYear) ? numericYear : null,
    date: formatEventDate(e),
    tagLabel,
    category,
    catVar: CATEGORY_VAR[category],
    title,
    place,
    body,
    imageSrc,
  };
}

/* ── Atoms ────────────────────────────────────────────────────────────────── */

function EventTag({ ev }: { ev: DisplayEvent }) {
  if (!ev.tagLabel) return null;
  return (
    <span className="rst-tag" style={{ "--rst-cat": ev.catVar } as React.CSSProperties}>
      {ev.tagLabel}
    </span>
  );
}

/* ── Vertical spine (mobile + print) ──────────────────────────────────────── */

function VerticalSpine({
  events,
  compact,
}: {
  events: DisplayEvent[];
  compact: boolean;
}) {
  return (
    <div className="rst-spine">
      <div className="rst-spine-rule" aria-hidden />
      <div className={`rst-spine-list ${compact ? "compact" : "comfortable"}`}>
        {events.map((ev) => (
          <div key={ev.key} className="rst-spine-row">
            <div className="rst-spine-gutter">
              <div className="rst-year">{ev.year}</div>
            </div>
            <span
              className="rst-spine-dot rst-marker"
              style={{ "--rst-cat": ev.catVar } as React.CSSProperties}
              aria-hidden
            />
            <div className="rst-spine-content">
              {ev.tagLabel || ev.date ? (
                <div className="rst-spine-tagrow">
                  <EventTag ev={ev} />
                  {ev.date ? <span className="rst-date">{ev.date}</span> : null}
                </div>
              ) : null}
              {ev.title ? <div className="rst-title">{ev.title}</div> : null}
              {ev.place ? <div className="rst-place">{ev.place}</div> : null}
              {ev.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="rst-thumb" src={ev.imageSrc} alt="" loading="lazy" />
              ) : null}
              {ev.body ? <MarkdownBody className="rst-body" text={ev.body} /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Horizontal ribbon (desktop) ──────────────────────────────────────────── */

function HorizontalRibbon({
  events,
  compact,
  scrolling,
}: {
  events: DisplayEvent[];
  compact: boolean;
  scrolling: boolean;
}) {
  const colW = compact ? 188 : 224;
  const inner = (
    <div className="rst-ribbon-inner">
      <div className="rst-ribbon-rule" aria-hidden />
      {events.map((ev) => (
        <div key={ev.key} className="rst-col" style={{ width: colW }}>
          <div className="rst-col-year">
            <div className="rst-year">{ev.year}</div>
          </div>
          <span
            className="rst-col-dot rst-marker"
            style={{ "--rst-cat": ev.catVar } as React.CSSProperties}
            aria-hidden
          />
          <div className="rst-col-content">
            <EventTag ev={ev} />
            {ev.date ? <div className="rst-date">{ev.date}</div> : null}
            {ev.title ? <div className="rst-title">{ev.title}</div> : null}
            {ev.place ? <div className="rst-place">{ev.place}</div> : null}
            {ev.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="rst-thumb" src={ev.imageSrc} alt="" loading="lazy" />
            ) : null}
            {ev.body ? <MarkdownBody className="rst-body" text={ev.body} /> : null}
          </div>
        </div>
      ))}
    </div>
  );

  if (!scrolling) {
    return (
      <div className="rst-ribbon-wrap">{inner}</div>
    );
  }

  return (
    <div className="rst-ribbon-scroll">
      <div className="rst-ribbon-wrap">
        <div className="rst-ribbon-track">{inner}</div>
      </div>
      <div className="rst-scrollhint-row">
        <span className="rst-scrollhint">
          Scroll
          <svg viewBox="0 0 24 8" width="22" height="8" fill="none" aria-hidden>
            <path
              d="M0 4h21M18 1l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}

/* ── Pager ────────────────────────────────────────────────────────────────── */

function ChevronLeft() {
  return (
    <svg viewBox="0 0 8 12" width="7" height="11" fill="none" aria-hidden>
      <path d="M6.5 1 1.5 6l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 8 12" width="7" height="11" fill="none" aria-hidden>
      <path d="M1.5 1 6.5 6l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Pager({
  page,
  pageCount,
  rangeLabel,
  onPrev,
  onNext,
}: {
  page: number;
  pageCount: number;
  rangeLabel: string | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="rst-pager">
      <button type="button" className="rst-pager-btn prev" onClick={onPrev} disabled={page <= 0}>
        <ChevronLeft />
        <span className="label">Previous</span>
      </button>
      <div className="rst-pager-center">
        <span className="rst-pager-count">
          Page <span className="cur">{page + 1}</span> of {pageCount}
        </span>
        {rangeLabel ? <span className="rst-pager-range">{rangeLabel}</span> : null}
      </div>
      <button type="button" className="rst-pager-btn next" onClick={onNext} disabled={page >= pageCount - 1}>
        <span className="label">Next</span>
        <ChevronRight />
      </button>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export type RuledSpineTimelineProps = {
  events: IndividualDetailEvent[];
  timelineSubject: TimelineSubject;
  resolveImageSrc: (ref: string) => string | null;
  /** Header title — the block label, or a default. */
  title?: string;
  /** Pagination on (from `b.pag`). */
  pag: boolean;
  /** Events per page (from `b.perPage`); falls back to 5 mobile / 3 desktop. */
  perPage?: number;
  page: number;
  onPageChange: (next: number) => void;
};

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export function RuledSpineTimeline({
  events,
  timelineSubject,
  resolveImageSrc,
  title,
  pag,
  perPage,
  page,
  onPageChange,
}: RuledSpineTimelineProps) {
  const isMobile = useIsMobile();

  const display = useMemo(
    () => events.map((e, i) => mapEvent(e, i, timelineSubject, resolveImageSrc)),
    [events, timelineSubject, resolveImageSrc],
  );

  // Header meta: subject · first–last year span.
  const subjectName =
    timelineSubject.kind === "individual" ? timelineSubject.displayName?.trim() : null;
  const years = display.map((d) => d.numericYear).filter((y): y is number => y != null);
  const span = years.length ? `${Math.min(...years)} – ${Math.max(...years)}` : null;
  const headTitle = title?.trim() || "A Life in Dates";
  const headMeta = [subjectName, span].filter(Boolean).join(" · ");

  // Pagination math.
  const effectivePerPage = pag
    ? Math.max(1, perPage && perPage > 0 ? perPage : isMobile ? 5 : 3)
    : display.length || 1;
  const pageCount = pag ? Math.max(1, Math.ceil(display.length / effectivePerPage)) : 1;
  const clampedPage = Math.min(Math.max(0, page), pageCount - 1);

  // Keep parent page state in range when perPage / breakpoint changes.
  useEffect(() => {
    if (clampedPage !== page) onPageChange(clampedPage);
  }, [clampedPage, page, onPageChange]);

  const pageEvents = pag
    ? display.slice(clampedPage * effectivePerPage, clampedPage * effectivePerPage + effectivePerPage)
    : display;

  const pageYears = pageEvents.map((d) => d.numericYear).filter((y): y is number => y != null);
  const rangeLabel = pageYears.length
    ? Math.min(...pageYears) === Math.max(...pageYears)
      ? `${Math.min(...pageYears)}`
      : `${Math.min(...pageYears)} – ${Math.max(...pageYears)}`
    : null;

  const goPrev = useCallback(() => onPageChange(Math.max(0, clampedPage - 1)), [clampedPage, onPageChange]);
  const goNext = useCallback(
    () => onPageChange(Math.min(pageCount - 1, clampedPage + 1)),
    [clampedPage, pageCount, onPageChange],
  );

  // Arrow-key paging only when focus is inside the timeline. Stop propagation so the
  // reader's window-level handler doesn't also turn the story page.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!pag) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        goNext();
      }
    },
    [pag, goPrev, goNext],
  );

  return (
    <div className="rst-root" tabIndex={pag ? 0 : -1} onKeyDown={onKeyDown}>
      <div className="rst-head">
        <div className="rst-head-title">{headTitle}</div>
        {headMeta ? <div className="rst-head-meta">{headMeta}</div> : null}
      </div>

      {/* Interactive (screen) view */}
      <div className="rst-screen">
        {isMobile ? (
          <VerticalSpine events={pageEvents} compact={false} />
        ) : (
          <HorizontalRibbon events={pageEvents} compact={false} scrolling={!pag} />
        )}
        {pag && pageCount > 1 ? (
          <Pager page={clampedPage} pageCount={pageCount} rangeLabel={rangeLabel} onPrev={goPrev} onNext={goNext} />
        ) : null}
      </div>

      {/* Print view — all events, vertical spine, no pager */}
      <div className="rst-print">
        <VerticalSpine events={display} compact={false} />
      </div>
    </div>
  );
}
