"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Baby,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Heart,
  HeartCrack,
  MapPin,
  Skull,
} from "lucide-react";
import type { PublicProfileTimelineItem } from "@/lib/timeline/public-timeline";
import { isPrimaryTimelineContext } from "@/lib/timeline/public-timeline";
import { LivingGatedEventPrompt } from "@/components/events/LivingGatedEventPrompt";
import { cn } from "@/lib/utils";

const MOBILE_TIMELINE_PAGE_SIZE = 3;

const MONTH_INDEX: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

function friendlyTimelineLabel(title: string): string {
  return title.replace(/\bGrad\b/gi, "Graduation");
}

function timelineEventIcon(title: string) {
  const t = title.trim().toLowerCase();
  if (t.startsWith("birth")) return Baby;
  if (t.startsWith("death")) return Skull;
  if (t.includes("divorce")) return HeartCrack;
  if (t.includes("marriage") || t.includes("wedding")) return Heart;
  if (t.includes("graduation") || t.includes("educ")) return GraduationCap;
  return CalendarDays;
}

function timelineDateSortKey(dateLabel: string): { year: number; month: number; day: number } | null {
  const raw = (dateLabel ?? "").trim().toUpperCase();
  if (!raw) return null;
  const parts = raw.split(/\s+/).filter(Boolean);
  const yearPart = parts.find((part) => /^\d{4}$/.test(part));
  if (!yearPart) return null;
  const year = Number(yearPart);
  const monthPart = parts.find((part) => MONTH_INDEX[part.slice(0, 3)] != null);
  const month = monthPart ? MONTH_INDEX[monthPart.slice(0, 3)] : 0;
  const dayPart = parts.find((part) => /^\d{1,2}$/.test(part));
  const day = dayPart ? Number(dayPart) : 0;
  return { year, month, day };
}

const timelineDotPrimaryClass =
  "h-3.5 w-3.5 box-content rounded-full bg-crimson ring-4 ring-bg";
const timelineDotSecondaryClass =
  "h-3.5 w-3.5 box-content rounded-full border-2 border-accent-muted bg-surface-elevated ring-4 ring-bg";

function TimelineDotLegend() {
  return (
    <div
      className="mb-4 rounded-xl border border-border-subtle/70 bg-surface/70 px-3 py-2.5"
      aria-label="Timeline marker key"
    >
      <p className="font-body text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-muted">Marker key</p>
      <ul className="mt-2 flex flex-col gap-2">
        <li className="flex min-w-0 items-center gap-2.5">
          <span className={cn("shrink-0", timelineDotPrimaryClass)} aria-hidden />
          <span className="font-body text-xs leading-snug text-muted">This person&apos;s own events</span>
        </li>
        <li className="flex min-w-0 items-center gap-2.5">
          <span className={cn("shrink-0", timelineDotSecondaryClass)} aria-hidden />
          <span className="font-body text-xs leading-snug text-muted">A relative&apos;s events during their lifetime</span>
        </li>
      </ul>
    </div>
  );
}

export function MobileProfileTimeline({ items }: { items: PublicProfileTimelineItem[] }) {
  const [page, setPage] = useState(1);
  const sortedItems = useMemo(() => {
    return [...items]
      .map((item, idx) => ({ item, idx, key: timelineDateSortKey(item.dateLabel) }))
      .sort((a, b) => {
        if (!a.key && !b.key) return a.idx - b.idx;
        if (!a.key) return 1;
        if (!b.key) return -1;
        if (a.key.year !== b.key.year) return a.key.year - b.key.year;
        if (a.key.month !== b.key.month) return a.key.month - b.key.month;
        if (a.key.day !== b.key.day) return a.key.day - b.key.day;
        return a.idx - b.idx;
      })
      .map((entry) => entry.item);
  }, [items]);
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / MOBILE_TIMELINE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const visibleItems = useMemo(() => {
    const start = (safePage - 1) * MOBILE_TIMELINE_PAGE_SIZE;
    return sortedItems.slice(start, start + MOBILE_TIMELINE_PAGE_SIZE);
  }, [safePage, sortedItems]);

  const showDotLegend = useMemo(() => {
    const hasPrimary = sortedItems.some((item) => isPrimaryTimelineContext(item.context));
    const hasSecondary = sortedItems.some((item) => !isPrimaryTimelineContext(item.context));
    return hasPrimary && hasSecondary;
  }, [sortedItems]);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border-subtle bg-surface/60 px-4 py-8 text-center font-body text-sm leading-relaxed text-muted">
        No events are attached yet.
      </p>
    );
  }

  return (
    <div className="min-w-0">
      {showDotLegend ? <TimelineDotLegend /> : null}
      <ol className="relative ml-1 space-y-0 pb-2 pl-6">
        <span
          className="pointer-events-none absolute bottom-2 left-[7px] top-2 w-0.5 bg-gradient-to-b from-crimson via-crimson/70 to-accent-muted"
          aria-hidden
        />
        {visibleItems.map((item) => {
          const primary = isPrimaryTimelineContext(item.context);
          return (
            <li key={item.id} className="relative pb-6 last:pb-0">
              <span
                className={cn(
                  "absolute -left-6 top-1.5",
                  primary ? timelineDotPrimaryClass : timelineDotSecondaryClass,
                )}
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-body text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-crimson">{item.dateLabel}</p>
                <span className="rounded-full border border-border-subtle bg-surface/80 px-2 py-0.5 font-body text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  {item.context}
                </span>
              </div>
              <h3 className="mt-[4px] flex items-start gap-1.5 font-heading text-base font-semibold leading-snug text-heading">
                {(() => {
                  const Icon = timelineEventIcon(item.title);
                  return (
                    <span className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full bg-link/12 p-[5px]">
                      <Icon className="h-4 w-4 text-link" strokeWidth={1.7} aria-hidden />
                    </span>
                  );
                })()}
                <span>{friendlyTimelineLabel(item.title)}</span>
              </h3>
              {item.privacyRestricted && item.loginHref ? (
                <div className="mt-2">
                  <LivingGatedEventPrompt loginHref={item.loginHref} />
                </div>
              ) : (
                <>
                  {item.place ? (
                    <p className="mt-1 flex items-start gap-1 font-body text-xs text-muted">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-link/80" aria-hidden />
                      <span>{item.place}</span>
                    </p>
                  ) : null}
                  {item.description ? (
                    <p className="mt-1.5 font-body text-sm leading-relaxed text-muted">{item.description}</p>
                  ) : null}
                </>
              )}
            </li>
          );
        })}
      </ol>

      {totalPages > 1 ? (
        <nav aria-label="Timeline pagination" className="mt-6 flex items-center justify-center gap-3 border-t border-border-subtle/70 pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </button>
          <span className="font-body text-xs font-semibold tabular-nums text-muted">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
