"use client";

import Link from "next/link";
import { useState } from "react";
import { useTreeUpcomingEvents } from "@/hooks/useTreeData";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { UpcomingEvent } from "@/types/tree";
import { Cake, Heart, List, Skull } from "lucide-react";

type EventFilter = "all" | UpcomingEvent["eventType"];

const TABS: { value: EventFilter; label: string; icon: typeof Cake }[] = [
  { value: "all", label: "All", icon: List },
  { value: "BIRT", label: "Birth", icon: Cake },
  { value: "DEAT", label: "Death", icon: Skull },
  { value: "MARR", label: "Marriage", icon: Heart },
];

const EVENT_LABELS: Record<UpcomingEvent["eventType"], string> = {
  BIRT: "Birth",
  DEAT: "Death",
  MARR: "Marriage",
};

const EVENT_ICONS: Record<UpcomingEvent["eventType"], typeof Cake> = {
  BIRT: Cake,
  DEAT: Skull,
  MARR: Heart,
};

/** Strip GEDCOM surname delimiters "/" for display. */
function stripSlashes(s: string | null | undefined): string {
  if (s == null || s === "") return "";
  return s.replace(/\//g, "").replace(/\s+/g, " ").trim();
}

function getEventNameLine(ev: UpcomingEvent): string {
  if (ev.individual) return stripSlashes(ev.individual.fullName);
  if (ev.family?.husband?.fullName || ev.family?.wife?.fullName) {
    return [
      stripSlashes(ev.family.husband?.fullName),
      stripSlashes(ev.family.wife?.fullName),
    ]
      .filter(Boolean)
      .join(" & ");
  }
  return "";
}

/** Render name with last word (surname) in italic. Handles "A & B" for couples. */
function nameWithItalicSurname(name: string): React.ReactNode {
  if (!name.trim()) return "—";
  const formatOne = (s: string) => {
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return <span className="italic">{parts[0]}</span>;
    const last = parts.pop()!;
    return <>{parts.join(" ")} <span className="italic">{last}</span></>;
  };
  if (name.includes(" & ")) {
    const [a, b] = name.split(" & ").map((s) => s.trim());
    return <>{formatOne(a)} & {formatOne(b)}</>;
  }
  return formatOne(name);
}

function getEventDateStr(ev: UpcomingEvent): string {
  return ev.date?.original ?? "Date unknown";
}

function getEventPlaceStr(ev: UpcomingEvent): string {
  return stripSlashes(ev.place?.original ?? ev.place?.name ?? "");
}

/**
 * UpcomingDates — births, deaths, and marriages in the next 3 months (by month/day).
 */
export function UpcomingDates() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { data, isPending, error } = useTreeUpcomingEvents();
  const [activeTab, setActiveTab] = useState<EventFilter>("all");

  if (error) {
    return (
      <section className="w-full px-6 py-12 md:px-10">
        <p className="text-muted">Unable to load upcoming dates.</p>
      </section>
    );
  }

  if (isPending || !data) {
    return (
      <section className="w-full px-6 py-12 md:px-10">
        <p className="section-subtitle mb-2">dates</p>
        <h2 className="mb-3 font-heading text-2xl font-semibold tracking-tight text-heading md:text-4xl">
          Upcoming{" "}
          <span
            className="italic"
            style={{
              textDecoration: "underline",
              textDecorationColor: "var(--crimson)",
              textDecorationThickness: "2px",
              textUnderlineOffset: "3px",
            }}
          >
            Dates
          </span>
        </h2>
        <p className="text-muted">Loading…</p>
      </section>
    );
  }

  const { window: w, events } = data;
  const filteredEvents =
    activeTab === "all"
      ? events
      : events.filter((e) => e.eventType === activeTab);
  const startDate = `${w.start.month}/${w.start.day}`;
  const endDate = `${w.end.month}/${w.end.day}`;

  return (
    <section
      className="relative w-full overflow-hidden pb-12 md:pb-16"
      aria-label="Upcoming dates"
      style={{ backgroundColor: "#e8d9c1" }}
    >
      <div
        className="absolute inset-0 z-0"
        aria-hidden
        style={{
          backgroundImage: `linear-gradient(to top, color-mix(in srgb, var(--bg) 55%, transparent) 0%, transparent 45%), radial-gradient(ellipse 120% 100% at 50% 0%, color-mix(in srgb, var(--bg) 50%, transparent), transparent 65%), linear-gradient(color-mix(in srgb, var(--bg) 80%, transparent), color-mix(in srgb, var(--bg) 80%, transparent)), url("/images/agedbg1.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          maskImage: "linear-gradient(to bottom, black 0%, black 18%, transparent 45%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 18%, transparent 45%)",
        }}
      />
      <div
        className="absolute inset-0 z-0"
        aria-hidden
        style={{
          backgroundImage: "url(\"/images/agedpaperbg2.png\")",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          opacity: 0.25,
          filter: "blur(16px)",
          maskImage: "linear-gradient(to bottom, black 0%, black 18%, transparent 45%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 18%, transparent 45%)",
        }}
      />
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 md:items-start">
        <div className="md:pr-8">
          <div className="px-6 py-12 md:px-10">
            <p className="section-subtitle mb-2">dates</p>
            <h2 className="mb-3 font-heading text-2xl font-semibold tracking-tight text-heading md:text-4xl">
              Upcoming{" "}
              <span
                className="italic"
                style={{
                  textDecoration: "underline",
                  textDecorationColor: "var(--crimson)",
                  textDecorationThickness: "2px",
                  textUnderlineOffset: "3px",
                }}
              >
                Dates
              </span>
            </h2>
            <p className="text-lg md:text-lg text-muted mb-6">
              These are the upcoming birthdays, anniversaries, and days of remembrance that shaped the Gonsalves story. Below are the first <span className="font-bold">six</span> events from <span className="font-bold">{startDate}</span> through <span className="font-bold">{endDate}</span> (next 3 months).
            </p>

            {events.length === 0 && (
              <p className="text-muted">No births, deaths, or marriages in this window.</p>
            )}
            {events.length > 0 && (
              <>
                <div className="mb-0 md:mb-4 flex flex-wrap gap-2 pb-2 mt-2 justify-start w-fit max-w-full md:w-full rounded-lg p-3 py-5 pb-4 md:p-0 md:py-0 md:pb-0" role="tablist" aria-label="Filter by event type">
                  {TABS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === value}
                      aria-label={label}
                      onClick={() => setActiveTab(value)}
                      className={`font-body inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring -translate-y-[3px] md:translate-y-0 ${
                        activeTab === value
                          ? "bg-primary/70 text-primary-foreground"
                          : "bg-[#dcc09b]/55 text-primary hover:bg-[#dcc09b]/75"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="hidden md:inline text-xs sm:text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {events.length > 0 && isDesktop && filteredEvents.length > 0 && (
            <ul className="grid w-full grid-cols-2 gap-2 sm:gap-4 md:gap-4 items-stretch list-none p-0 m-0 mt-2 md:-translate-y-[21px]">
              {filteredEvents.slice(0, 2).map((ev, i) => {
                const Icon = EVENT_ICONS[ev.eventType];
                const label = EVENT_LABELS[ev.eventType];
                const placeStr = getEventPlaceStr(ev);
                const scatterClass = ["md:-rotate-5 md:translate-x-5 md:translate-y-2 md:z-10", "md:rotate-[4deg] md:translate-x-2 md:translate-y-2 md:z-0"][i];
                const bgClass = "bg-[#ede6d5] dark:bg-[#ede6d5]";
                return (
                  <li
                    key={`left-${ev.eventType}-${ev.date?.original ?? ""}-${i}`}
                    className={`group relative flex min-h-0 flex-col justify-center overflow-hidden rounded-lg border border-[var(--crimson)]/10 ${bgClass} backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.025)] transition-all duration-300 hover:scale-[1.03] hover:border-[var(--crimson)]/25 hover:shadow-[0_4px_28px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_28px_rgba(0,0,0,0.08)] md:hover:z-50 ${scatterClass}`}
                  >
                    <div
                      className="absolute inset-0 rounded-lg pointer-events-none"
                      style={{ background: "radial-gradient(ellipse 120% 60% at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 55%)" }}
                      aria-hidden
                    />
                    <div className="shrink-0 flex flex-col gap-0 relative z-[1]">
                      <div className="flex flex-col items-center gap-2 px-1 pt-8 pb-1 -mt-5 -mx-1 rounded-t-lg sm:px-8 sm:pt-10 sm:-mx-6">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-text/4 text-text/50">
                          <Icon className="h-7 w-7" aria-hidden />
                        </span>
                        <p className="section-subtitle mb-0 text-sm">{label}</p>
                      </div>
                      <div className="px-3 pb-4 flex flex-col gap-3 sm:px-6 sm:pb-5">
                        <p className="font-heading text-xl font-semibold tracking-tight text-heading mt-0 w-full text-center">
                          {nameWithItalicSurname(getEventNameLine(ev))}
                        </p>
                        <p className="font-body text-sm leading-relaxed text-text/90 mt-0 w-full text-center">
                          <span className="font-bold text-primary">
                            {getEventDateStr(ev)}
                          </span>
                          {placeStr ? <> · {placeStr}</> : null}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {events.length > 0 && (
          <div>
          {filteredEvents.length === 0 ? (
            <p className="text-muted">
              {activeTab === "all" ? "No events in this window." : `No ${EVENT_LABELS[activeTab].toLowerCase()} events in this window.`}
            </p>
          ) : isDesktop ? (
          <ul className="grid w-full grid-cols-2 gap-2 sm:gap-4 md:gap-4 items-stretch list-none p-0 m-0 md:translate-y-16">
          {filteredEvents.slice(2, 6).map((ev, i) => {
            const Icon = EVENT_ICONS[ev.eventType];
            const label = EVENT_LABELS[ev.eventType];
            const placeStr = getEventPlaceStr(ev);
            const scatterClass = ["md:rotate-[14deg] md:-translate-x-8 md:translate-y-4 md:z-0", "md:-rotate-[5deg] md:-translate-x-14 md:translate-y-1 md:z-10", "md:-rotate-12 md:-translate-x-12 md:translate-y-8 md:z-20", "md:rotate-8 md:-translate-x-12 md:-translate-y-3 md:z-0"][i];
            const bgClass = "bg-[#ede6d5] dark:bg-[#ede6d5]";
            return (
              <li
                key={`right-${ev.eventType}-${ev.date?.original ?? ""}-${i + 2}`}
                className={`group relative flex min-h-0 flex-col justify-center overflow-hidden rounded-lg border border-[var(--crimson)]/10 ${bgClass} backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.025)] transition-all duration-300 hover:scale-[1.03] hover:border-[var(--crimson)]/25 hover:shadow-[0_4px_28px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_28px_rgba(0,0,0,0.08)] md:hover:z-50 ${scatterClass}`}
              >
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 120% 60% at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 55%)" }}
                  aria-hidden
                />
                <div className="shrink-0 flex flex-col gap-0 relative z-[1]">
                  <div className="flex flex-col items-center gap-2 px-1 pt-8 pb-1 -mt-5 -mx-1 rounded-t-lg sm:px-8 sm:pt-10 sm:-mx-6">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-text/4 text-text/50">
                      <Icon className="h-7 w-7" aria-hidden />
                    </span>
                    <p className="section-subtitle mb-0 text-sm">{label}</p>
                  </div>
                  <div className="px-3 pb-4 flex flex-col gap-3 sm:px-6 sm:pb-5">
                  <p className="font-heading text-xl font-semibold tracking-tight text-heading mt-0 w-full text-center">
                    {nameWithItalicSurname(getEventNameLine(ev))}
                  </p>
                  <p className="font-body text-sm leading-relaxed text-text/90 mt-0 w-full text-center">
                    <span className="font-bold text-primary">
                      {getEventDateStr(ev)}
                    </span>
                    {placeStr ? <> · {placeStr}</> : null}
                  </p>
                  </div>
                </div>
              </li>
            );
          })}
          </ul>
          ) : (
          <div className="flex flex-col items-center w-full -translate-y-10 md:translate-y-0">
          <div className="carousel carousel-center w-full overflow-x-auto overflow-y-visible -mt-3 scroll-smooth" style={{ scrollSnapType: "x mandatory" }} role="list" aria-label="Upcoming dates">
          {filteredEvents.slice(0, 6).map((ev, i) => {
            const Icon = EVENT_ICONS[ev.eventType];
            const label = EVENT_LABELS[ev.eventType];
            const placeStr = getEventPlaceStr(ev);
            const bgClass = "bg-[#ede6d5] dark:bg-[#ede6d5]";
            const len = Math.min(6, filteredEvents.length);
            const roundClass = len === 1 ? "rounded-lg" : i === 0 ? "rounded-l-lg" : i === len - 1 ? "rounded-r-lg" : "rounded-none";
            return (
              <div
                key={`mobile-${ev.eventType}-${ev.date?.original ?? ""}-${i}`}
                id={i === 0 ? "upcoming-item1" : `upcoming-item${i + 1}`}
                className="carousel-item w-[85vw] max-w-[340px] shrink-0 scroll-snap-center"
                style={{ scrollSnapAlign: "center" }}
              >
                <div
                  className={`group relative flex min-h-0 w-full flex-col justify-center overflow-hidden ${roundClass} ${bgClass} backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.025)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_4px_28px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_28px_rgba(0,0,0,0.08)]`}
                >
                  <div
                    className={`absolute inset-0 ${roundClass} pointer-events-none`}
                    style={{ background: "radial-gradient(ellipse 120% 60% at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 55%)" }}
                    aria-hidden
                  />
                  <div className="shrink-0 flex flex-col gap-0 px-6 py-6 relative z-[1]">
                    <div className={`flex flex-col items-center gap-2 px-4 pt-10 pb-2 -mt-5 sm:px-8 sm:pt-10 sm:-mx-6 ${i === 0 ? "rounded-tl-lg" : i === len - 1 ? "rounded-tr-lg" : ""}`}>
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-text/4 text-text/50">
                        <Icon className="h-7 w-7" aria-hidden />
                      </span>
                      <p className="section-subtitle mb-0 text-sm">{label}</p>
                    </div>
                    <div className="px-4 pb-6 flex flex-col gap-3 sm:px-6 sm:pb-5">
                    <p className="font-heading text-xl font-semibold tracking-tight text-heading mt-0 w-full text-center">
                      {nameWithItalicSurname(getEventNameLine(ev))}
                    </p>
                    <p className="font-body text-sm leading-relaxed text-text/90 mt-0 w-full text-center">
                      <span className="font-bold text-primary">
                        {getEventDateStr(ev)}
                      </span>
                      {placeStr ? <> · {placeStr}</> : null}
                    </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
          <div className="flex flex-wrap gap-2 justify-center w-fit max-w-full rounded-lg p-3 py-4 mt-6" role="group" aria-label="Carousel slide indicators">
            {[1, 2, 3, 4, 5, 6].slice(0, Math.min(6, filteredEvents.length)).map((n) => (
              <a
                key={n}
                href={`#upcoming-item${n}`}
                className="font-body inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors bg-[#dcc09b]/55 text-primary hover:bg-[#dcc09b]/75 focus:outline-none focus:ring-2 focus:ring-focus-ring"
                aria-label={`Go to slide ${n}`}
              >
                {n}
              </a>
            ))}
          </div>
          </div>
          )}
          {filteredEvents.length > 6 && (
            <p className="mt-8 md:mt-36 text-right mr-10 md:mr-16 -translate-y-10 md:translate-y-0">
                <Link
                  href="/dates"
                  className="font-body inline-block rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow focus:outline-none focus:ring-2 focus:ring-focus-ring transition-shadow"
                >
                  See more dates…
                </Link>
              </p>
          )}
          </div>
        )}
      </div>
    </section>
  );
}
