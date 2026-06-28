"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { LivingGatedEventPrompt } from "@/components/events/LivingGatedEventPrompt";
import type { PublicProfileTimelineItem } from "@/lib/timeline/public-timeline";

const EVENTS_PER_PAGE = 4;
type TimelineLayout = "horizontal" | "vertical";

export function ProfileTimeline({ items }: { items: PublicProfileTimelineItem[] }) {
  const [page, setPage] = useState(1);
  const [layout, setLayout] = useState<TimelineLayout>("horizontal");
  const totalPages = Math.max(1, Math.ceil(items.length / EVENTS_PER_PAGE));
  const visibleItems = useMemo(() => {
    const start = (page - 1) * EVENTS_PER_PAGE;
    return items.slice(start, start + EVENTS_PER_PAGE);
  }, [items, page]);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-8 text-center text-sm text-muted">
        No events are attached yet.
      </p>
    );
  }

  return (
    <div className="min-w-0">
      <div className="mb-7 flex flex-col items-center justify-between gap-3 rounded-2xl border border-border-subtle/80 bg-surface/70 px-4 py-3 shadow-[0_6px_20px_rgba(60,45,25,0.04)] sm:flex-row">
        <p className="text-sm leading-relaxed text-muted">
          Showing {visibleItems.length} of {items.length} events
        </p>
        <div
          className="hidden rounded-xl border border-border-subtle bg-bg/70 p-1 shadow-inner sm:inline-flex"
          role="group"
          aria-label="Timeline layout"
        >
          {(["horizontal", "vertical"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLayout(option)}
              aria-pressed={layout === option}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                layout === option
                  ? "bg-link text-white shadow-[0_6px_16px_rgba(31,90,56,0.18)]"
                  : "text-link hover:bg-link-soft-bg hover:text-link-soft-fg"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className={layout === "horizontal" ? "max-w-4xl mx-auto sm:max-w-full sm:overflow-x-auto sm:pb-2" : "max-w-4xl mx-auto"}>
        <ul
          className={[
            "timeline timeline-snap-icon min-w-0",
            layout === "horizontal"
              ? "timeline-vertical timeline-compact sm:timeline-horizontal sm:min-w-[860px]"
              : "timeline-vertical timeline-compact sm:timeline-normal",
          ].join(" ")}
        >
        {visibleItems.map((item, index) => {
          const alignStart = layout === "horizontal" ? index % 2 === 0 : index % 2 !== 0;
          const sideClass = alignStart ? "timeline-start" : "timeline-end";
          return (
            <li key={item.id} className="min-w-0">
              {index > 0 ? <hr className="bg-border-subtle" /> : null}
              <div className="timeline-middle">
                <span className="flex h-4 w-4 rounded-full border border-link/45 bg-bg shadow-[0_0_0_6px_rgba(129,89,58,0.12)]">
                  <span className="m-auto h-1.5 w-1.5 rounded-full bg-link/80" />
                </span>
              </div>
              <div
                className={[
                  sideClass,
                  layout === "horizontal" ? "w-full px-3 py-2 sm:w-auto sm:py-0" : "w-full px-3 py-2",
                ].join(" ")}
              >
                <article className="group relative max-w-none overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated/95 p-5 text-left shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.13)] sm:min-w-[18rem]">
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-link/70 via-[#8b2e2e]/35 to-transparent" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-link">{item.dateLabel}</p>
                    <p className="rounded-full border border-border-subtle bg-bg/70 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">
                      {item.context}
                    </p>
                  </div>
                  <h3 className="mt-3 font-heading text-xl font-semibold leading-snug text-heading">{item.title}</h3>
                  {item.privacyRestricted && item.loginHref ? (
                    <div className="mt-3">
                      <LivingGatedEventPrompt loginHref={item.loginHref} />
                    </div>
                  ) : (
                    <>
                      {item.place ? (
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-link" aria-hidden />
                          <span>{item.place}</span>
                        </p>
                      ) : null}
                      <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
                    </>
                  )}
                </article>
              </div>
              {index < visibleItems.length - 1 ? <hr className="bg-border-subtle" /> : null}
            </li>
          );
        })}
        </ul>
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Timeline pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              aria-current={pageNumber === page ? "page" : undefined}
              className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-semibold transition ${
                pageNumber === page
                  ? "border-link bg-link text-white shadow-[0_8px_20px_rgba(129,89,58,0.18)]"
                  : "border-border-subtle bg-surface text-link hover:bg-link-soft-bg hover:text-link-soft-fg"
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
