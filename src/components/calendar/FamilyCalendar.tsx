"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Baby, ChevronLeft, ChevronRight, Heart, Info, Skull, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarEventType } from "@/lib/calendar/query-calendar-events";

export type { CalendarEvent, CalendarEventType };
export type DayEvents = Record<string, CalendarEvent[]>;

interface FamilyCalendarProps {
  initialMonth: number; // 1–12
  initialYear: number;
  initialDays: DayEvents;
}

interface ModalState {
  day: number;
  month: number;
  year: number;
  events: CalendarEvent[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_FULL  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MAX_VISIBLE = 3;

const EVENT_META = {
  BIRT: {
    label: "Born",
    chipBg: "rgba(46,94,62,0.12)",
    chipText: "#2E5E3E",
    dotColor: "#2E5E3E",
    iconCls: "text-primary",
    Icon: Baby,
  },
  DEAT: {
    label: "Died",
    chipBg: "var(--surface-inset)",
    chipText: "var(--text-muted)",
    dotColor: "var(--text-muted)",
    iconCls: "text-[color:var(--text-muted)]",
    Icon: Skull,
  },
  MARR: {
    label: "Married",
    chipBg: "rgba(139,46,46,0.10)",
    chipText: "#8B2E2E",
    dotColor: "#8B2E2E",
    iconCls: "text-crimson",
    Icon: Heart,
  },
} satisfies Record<
  CalendarEventType,
  {
    label: string;
    chipBg: string;
    chipText: string;
    dotColor: string;
    iconCls: string;
    Icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  }
>;

const GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
};

const BORDER_COLOR = "var(--border-subtle)";
const CELL_BORDER: React.CSSProperties = {
  borderRight: `1px solid ${BORDER_COLOR}`,
  borderBottom: `1px solid ${BORDER_COLOR}`,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}
function firstDayOfWeek(month: number, year: number) {
  return new Date(year, month - 1, 1).getDay();
}
function isToday(day: number, month: number, year: number) {
  const now = new Date();
  return now.getDate() === day && now.getMonth() + 1 === month && now.getFullYear() === year;
}

// ---------------------------------------------------------------------------
// EventChip
// ---------------------------------------------------------------------------

function EventChip({ event }: { event: CalendarEvent }) {
  const meta = EVENT_META[event.eventType];
  return (
    <Link
      href={event.profileHref}
      onClick={(e) => e.stopPropagation()}
      className="flex min-w-0 items-center gap-1 overflow-hidden rounded px-1.5 py-[3px] font-body text-[11px] font-medium leading-none transition-opacity hover:opacity-75"
      style={{ backgroundColor: meta.chipBg, color: meta.chipText }}
    >
      <meta.Icon size={9} className="shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{event.displayName}</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// DayCell
// ---------------------------------------------------------------------------

function DayCell({
  day, month, year, events, onOpenModal,
}: {
  day: number;
  month: number;
  year: number;
  events: CalendarEvent[];
  onOpenModal: (day: number, events: CalendarEvent[]) => void;
}) {
  const today    = isToday(day, month, year);
  const visible  = events.slice(0, MAX_VISIBLE);
  const overflow = events.length - MAX_VISIBLE;
  const hasEvents = events.length > 0;
  const uniqueTypes = [...new Set(events.map((e) => e.eventType))] as CalendarEventType[];

  return (
    <div
      className="relative overflow-hidden bg-[color:var(--surface)]"
      style={{
        ...CELL_BORDER,
        minHeight: "clamp(5rem, 10vw, 8.5rem)",
      }}
    >
      {/* Day number */}
      <div className="px-1.5 pt-1.5 sm:px-2 sm:pt-2">
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full",
            "font-body text-[13px] font-medium leading-none sm:text-sm",
            today
              ? "bg-primary font-semibold text-white"
              : "text-[color:var(--text-muted)]",
          )}
        >
          {day}
        </span>
      </div>

      {/* ── Mobile: dots + tap whole cell ── */}
      {hasEvents && (
        <button
          type="button"
          className="absolute inset-0 flex items-end justify-end p-1.5 sm:hidden"
          onClick={() => onOpenModal(day, events)}
          aria-label={`${events.length} event${events.length > 1 ? "s" : ""} on ${MONTHS[month - 1]} ${day}`}
        >
          <div className="flex gap-0.5">
            {uniqueTypes.map((type) => (
              <span
                key={type}
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: EVENT_META[type].dotColor }}
              />
            ))}
          </div>
        </button>
      )}

      {/* ── Desktop: text chips + overflow ── */}
      <div className="mt-1 hidden flex-col gap-0.5 px-1.5 pb-1.5 sm:flex sm:px-2 sm:pb-2">
        {visible.map((ev) => (
          <EventChip key={ev.id} event={ev} />
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={() => onOpenModal(day, events)}
            className="rounded px-1.5 py-[3px] text-left font-body text-[10px] font-medium leading-none text-[color:var(--text-subtle)] transition-colors hover:bg-[color:var(--hover-overlay)] hover:text-[color:var(--text-muted)]"
          >
            +{overflow} more
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DayModal
// ---------------------------------------------------------------------------

function DayModal({ state, onClose }: { state: ModalState; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const dayName = DAY_FULL[new Date(state.year, state.month - 1, state.day).getDay()];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        style={{ zIndex: 10020 }}
        aria-hidden
        onClick={onClose}
      />

      {/* Panel — fixed centred in viewport, above navbar (z-[9999]) and mobile drawer (z-[10001]) */}
      <div
        role="dialog"
        aria-modal
        aria-label={`Events on ${MONTHS[state.month - 1]} ${state.day}`}
        className="fixed left-1/2 top-1/2 flex w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          zIndex: 10021,
          maxHeight: "min(85dvh, 600px)",
          backgroundColor: "var(--surface-elevated)",
          borderColor: BORDER_COLOR,
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-start justify-between border-b px-5 py-4"
          style={{ borderColor: BORDER_COLOR }}
        >
          <div>
            <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-subtle)]">
              {dayName}
            </p>
            <h2 className="mt-0.5 font-heading text-xl font-semibold text-[color:var(--heading)]">
              {MONTHS[state.month - 1]} {state.day}
            </h2>
            <p className="mt-0.5 font-body text-xs text-[color:var(--text-subtle)]">
              {state.events.length}{" "}
              {state.events.length === 1 ? "anniversary" : "anniversaries"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--hover-overlay)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable event list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {(["BIRT", "MARR", "DEAT"] as CalendarEventType[]).map((type) => {
            const typeEvents = state.events.filter((e) => e.eventType === type);
            if (typeEvents.length === 0) return null;
            const meta = EVENT_META[type];
            return (
              <div key={type} className="mb-5 last:mb-0">
                <div className="mb-2.5 flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: meta.dotColor }}
                  />
                  <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-subtle)]">
                    {meta.label}
                  </p>
                </div>
                <ul className="space-y-0.5">
                  {typeEvents.map((ev) => (
                    <li key={ev.id}>
                      <Link
                        href={ev.profileHref}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[color:var(--hover-overlay)]"
                      >
                        <meta.Icon
                          size={14}
                          className={cn("shrink-0", meta.iconCls)}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-body text-sm font-medium text-[color:var(--text)]">
                            {ev.displayName}
                          </p>
                          {ev.year !== null && (
                            <p className="font-body text-xs text-[color:var(--text-subtle)]">
                              {type === "BIRT" ? "b." : type === "DEAT" ? "d." : ""} {ev.year}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main calendar
// ---------------------------------------------------------------------------

const ALL_TYPES: CalendarEventType[] = ["BIRT", "MARR", "DEAT"];

export function FamilyCalendar({ initialMonth, initialYear, initialDays }: FamilyCalendarProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year,  setYear]  = useState(initialYear);
  const [days,  setDays]  = useState<DayEvents>(initialDays);
  const [loading, setLoading] = useState(false);
  const [modal,   setModal]   = useState<ModalState | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<CalendarEventType>>(new Set(ALL_TYPES));

  const toggleType = useCallback((type: CalendarEventType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        // Don't allow deselecting the last active type
        if (next.size === 1) return prev;
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const cache = useRef(new Map<number, DayEvents>([[initialMonth, initialDays]]));

  const navigate = useCallback(async (targetMonth: number, targetYear: number) => {
    let m = targetMonth;
    let y = targetYear;
    if (m < 1)  { m = 12; y--; }
    if (m > 12) { m = 1;  y++; }

    setMonth(m);
    setYear(y);

    if (cache.current.has(m)) {
      setDays(cache.current.get(m)!);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tree/events/calendar?month=${m}`);
      if (res.ok) {
        const data = (await res.json()) as { days: DayEvents };
        cache.current.set(m, data.days);
        setDays(data.days);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const openModal  = useCallback((day: number, events: CalendarEvent[]) => setModal({ day, month, year, events }), [month, year]);
  const closeModal = useCallback(() => setModal(null), []);

  // Whether the current month (after type filtering) has any events at all
  const hasAnyEvents = Object.values(days).some((evs) =>
    (evs as CalendarEvent[]).some((e) => activeTypes.has(e.eventType)),
  );

  // Build cell array: leading nulls (offset) + day numbers 1…N, padded to full rows of 7
  const totalDays = daysInMonth(month, year);
  const offset    = firstDayOfWeek(month, year);
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="py-6 sm:py-8">
      {/* Card */}
      <div
        className="overflow-hidden rounded-2xl shadow-sm"
        style={{
          border: `1px solid ${BORDER_COLOR}`,
          backgroundColor: "var(--surface)",
        }}
      >
        {/* ── Month navigation ── */}
        <div
          className="flex items-center"
          style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
        >
          <button
            type="button"
            onClick={() => void navigate(month - 1, year)}
            disabled={loading}
            aria-label="Previous month"
            className="flex h-12 w-12 shrink-0 items-center justify-center text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--hover-overlay)] disabled:opacity-40"
          >
            <ChevronLeft size={20} />
          </button>

          <h2
            className={cn(
              "flex-1 text-center font-heading text-lg font-semibold text-[color:var(--heading)] sm:text-xl",
              loading && "opacity-40",
            )}
          >
            {MONTHS[month - 1]} {year}
          </h2>

          <button
            type="button"
            onClick={() => void navigate(month + 1, year)}
            disabled={loading}
            aria-label="Next month"
            className="flex h-12 w-12 shrink-0 items-center justify-center text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--hover-overlay)] disabled:opacity-40"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ── Filter pills ── */}
        <div
          className="flex flex-wrap items-center gap-2 px-4 py-2.5 sm:px-5"
          style={{
            borderBottom: `1px solid ${BORDER_COLOR}`,
            backgroundColor: "var(--surface-2)",
          }}
        >
          <span className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-subtle)]">
            Show
          </span>
          {ALL_TYPES.map((type) => {
            const meta    = EVENT_META[type];
            const active  = activeTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 font-body text-xs font-medium transition-all",
                  active
                    ? "border-transparent shadow-sm"
                    : "border-[color:var(--border-subtle)] bg-transparent text-[color:var(--text-subtle)] opacity-50 hover:opacity-75",
                )}
                style={
                  active
                    ? { backgroundColor: meta.chipBg, color: meta.chipText, borderColor: "transparent" }
                    : undefined
                }
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full transition-opacity"
                  style={{ backgroundColor: active ? meta.dotColor : "var(--text-subtle)" }}
                />
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* ── Contextual hint ── */}
        {hasAnyEvents && (
          <div
            className="flex items-center gap-2 px-4 py-2 sm:px-5"
            style={{
              borderBottom: `1px solid ${BORDER_COLOR}`,
              backgroundColor: "var(--surface-2)",
            }}
          >
            <Info size={12} className="shrink-0 text-[color:var(--text-subtle)]" aria-hidden />
            {/* Mobile hint */}
            <p className="font-body text-[11px] text-[color:var(--text-subtle)] sm:hidden">
              Tap a date to see its anniversaries
            </p>
            {/* Desktop hint */}
            <p className="hidden font-body text-[11px] text-[color:var(--text-subtle)] sm:block">
              Up to 3 events shown per day — click{" "}
              <span className="font-medium text-[color:var(--text-muted)]">+ more</span>{" "}
              to see the full list
            </p>
          </div>
        )}

        {/* ── Weekday header row ── */}
        <div
          style={{
            ...GRID_STYLE,
            borderBottom: `1px solid ${BORDER_COLOR}`,
            backgroundColor: "var(--surface-2)",
          }}
        >
          {DAY_SHORT.map((label, i) => (
            <div
              key={label}
              className="py-2 text-center font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-subtle)] sm:text-[11px]"
              style={i < 6 ? { borderRight: `1px solid ${BORDER_COLOR}` } : undefined}
            >
              {/* single char on tiny screens, abbreviated on sm+ */}
              <span className="sm:hidden">{label[0]}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Day cells ── */}
        <div
          style={{
            ...GRID_STYLE,
            opacity: loading ? 0.5 : 1,
            transition: "opacity 0.15s",
            // top & left borders come from the card border; each cell contributes bottom+right
            borderTop: `1px solid ${BORDER_COLOR}`,
            borderLeft: `1px solid ${BORDER_COLOR}`,
            marginTop: "-1px", // collapse with header bottom border
          }}
        >
          {cells.map((day, i) =>
            day === null ? (
              <div
                key={`empty-${i}`}
                style={{
                  ...CELL_BORDER,
                  minHeight: "clamp(5rem, 10vw, 8.5rem)",
                  backgroundColor: "var(--surface-2)",
                }}
              />
            ) : (
              <DayCell
                key={day}
                day={day}
                month={month}
                year={year}
                events={((days[String(day)] as CalendarEvent[] | undefined) ?? []).filter(
                  (e) => activeTypes.has(e.eventType),
                )}
                onOpenModal={openModal}
              />
            ),
          )}
        </div>
      </div>

      {modal && <DayModal state={modal} onClose={closeModal} />}
    </div>
  );
}
