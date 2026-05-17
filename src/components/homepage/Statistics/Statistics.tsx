"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useTreeHomeStatistics } from "@/hooks/useTreeData";
import type { HomeStatisticsPayload } from "@/types/tree";
import { cn } from "@/lib/utils";
import { StatCardDonut } from "./StatCardDonut";

const CHART_FALLBACK: HomeStatisticsPayload["charts"] = {
  individuals: { titleLine1: "Gender", titleLine2: "distribution", slices: [] },
  surnames: { titleLine1: "Surname", titleLine2: "distribution", slices: [] },
  families: { titleLine1: "Children", titleLine2: "distribution", slices: [] },
  places: { titleLine1: "Top places", titleLine2: "by birth", slices: [] },
};

const CREAM = "#F2EBE0";
/** Endpaper / design tokens aligned with `CultureFeatureCard` + Footer V1 */
const ENDPAPER_CRIMSON = "#8B2E2E";
const ENDPAPER_PRIMARY = "#1F3D28";
const CRIMSON = ENDPAPER_CRIMSON;
const GREEN = ENDPAPER_PRIMARY;

const DURATION_MS = 1500;
const STAGGER_MS = 120;
const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

function useCountUp(end: number, enabled: boolean, delayMs = 0): number {
  const [display, setDisplay] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof end !== "number") return;
    rafIdRef.current = null;

    const timeoutId = setTimeout(() => {
      startTimeRef.current = null;
      const step = (now: number) => {
        const start = startTimeRef.current ?? now;
        startTimeRef.current = start;
        const elapsed = now - start;
        const t = Math.min(elapsed / DURATION_MS, 1);
        const eased = EASE_OUT_CUBIC(t);
        setDisplay(Math.round(eased * end));
        if (t < 1) rafIdRef.current = requestAnimationFrame(step);
      };
      rafIdRef.current = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [end, enabled, delayMs]);

  return display;
}

type StatCardKey = "individuals" | "families" | "surnames" | "places";

/**
 * Statistics — “By the numbers” homepage section (editorial cards + DB-backed API).
 */
export function Statistics() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<StatCardKey>("individuals");

  const { data, isPending, isError } = useTreeHomeStatistics(refreshKey);

  const counts = data?.counts;
  const n = counts?.individuals ?? 0;
  const x = counts?.families ?? 0;
  const y = counts?.surnames ?? 0;
  const z = counts?.places ?? 0;

  const displayN = useCountUp(n, isInView && !isPending && !!data, 0);
  const displayX = useCountUp(x, isInView && !isPending && !!data, STAGGER_MS);
  const displayY = useCountUp(y, isInView && !isPending && !!data, STAGGER_MS * 2);
  const displayZ = useCountUp(z, isInView && !isPending && !!data, STAGGER_MS * 3);

  const handleRandomize = () => {
    setRefreshKey((k) => k + 1);
  };

  const cards: {
    key: StatCardKey;
    label: string;
    displayValue: number | null;
    example: string | null;
    exampleHref: string | null;
  }[] = [
    {
      key: "individuals",
      label: "Individuals",
      displayValue: isPending ? null : displayN,
      example: data?.examples.individual?.displayName ?? null,
      exampleHref: data?.examples.individual
        ? `/tree/viewer?xref=${encodeURIComponent(data.examples.individual.xref)}`
        : null,
    },
    {
      key: "surnames",
      label: "Surnames",
      displayValue: isPending ? null : displayY,
      example: data?.examples.surname?.surname ?? null,
      exampleHref: "/tree/surnames",
    },
    {
      key: "families",
      label: "Families",
      displayValue: isPending ? null : displayX,
      example: data?.examples.family?.displayName ?? null,
      exampleHref: "/families",
    },
    {
      key: "places",
      label: "Places",
      displayValue: isPending ? null : displayZ,
      example: data?.examples.place?.displayLabel ?? null,
      exampleHref: "/tree/places",
    },
  ];

  return (
    <section
      className="w-full max-w-full min-w-0 overflow-x-hidden border-t border-black/[0.06]"
      style={{ backgroundColor: CREAM }}
    >
      <div
        ref={sectionRef}
        className="relative z-10 mx-auto w-full min-w-0 max-w-[min(100%,1680px)] px-5 pb-11 pt-9 sm:px-6 md:px-8 md:pb-14 md:pt-11 lg:px-10 lg:pb-16 lg:pt-12"
      >
        <div className="flex w-full min-w-0 flex-col gap-4 md:gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="min-w-0 max-w-2xl">
            <p
              className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] md:text-xs"
              style={{ color: CRIMSON }}
            >
              By the numbers
            </p>
            <h2 className="font-heading text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-[#1a1612]">
              Family{" "}
              <span
                className="italic"
                style={{
                  textDecoration: "underline",
                  textDecorationColor: CRIMSON,
                  textDecorationThickness: "5px",
                  textUnderlineOffset: "6px",
                }}
              >
                statistics
              </span>
            </h2>
            <p className="mt-3 max-w-xl font-heading text-base italic leading-relaxed text-[#5c5348] md:text-lg">
              Click a category to highlight counts; each card links to a live example from the tree.
            </p>
          </div>
          <div className="flex w-full min-w-0 shrink-0 flex-wrap items-center gap-3 sm:w-auto lg:justify-end">
            <button
              type="button"
              onClick={handleRandomize}
              className="inline-flex items-center gap-2 rounded-md border border-[#b8aea0] bg-transparent px-4 py-2.5 font-sans text-sm font-medium text-[#4a4338] transition hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3D2F]/40"
            >
              <RefreshCw className="size-4 opacity-70" aria-hidden />
              Randomize
            </button>
            <Link
              href="/tree/statistics"
              className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-sans text-sm font-semibold text-white transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3D2F]/50"
              style={{ backgroundColor: GREEN }}
            >
              Explore more statistics
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>

        {isError && (
          <p className="mt-6 font-sans text-sm text-red-800">
            Statistics could not be loaded. Try again later.
          </p>
        )}

        <div className="mt-5 grid w-full min-w-0 grid-cols-1 gap-3 sm:mt-6 sm:gap-4 lg:mt-7 lg:grid-cols-4 lg:gap-4">
          {cards.map((c, index) => {
            const active = selected === c.key;
            const chart = (data?.charts ?? CHART_FALLBACK)[c.key];

            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelected(c.key)}
                className={cn(
                  "group relative flex w-full min-w-0 flex-col overflow-hidden rounded-sm border text-left transition duration-300",
                  "border-border-subtle/80 bg-surface-elevated/90 shadow-[0_10px_24px_rgba(60,45,25,0.08)] hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(60,45,25,0.12)]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2EBE0]",
                  active && "ring-2 ring-crimson/30 ring-offset-2 ring-offset-[#F2EBE0]",
                )}
              >
                <div className="relative flex h-16 shrink-0 items-center justify-start overflow-hidden border-b border-border-subtle/35 bg-transparent px-3 sm:h-[3.75rem] sm:px-4">
                  {active ? (
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-body text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted sm:right-3 sm:text-[0.6875rem]">
                      Active
                    </span>
                  ) : null}
                  <p className="bg-crimson px-3 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm sm:px-4 sm:py-2 sm:text-sm sm:tracking-[0.22em]">
                    {c.label}
                  </p>
                </div>
                <div className="flex min-h-0 flex-col px-4 py-4">
                  <h3 className="font-heading text-3xl font-semibold tabular-nums text-heading sm:text-4xl md:text-[2.25rem]">
                    {c.displayValue == null ? "—" : c.displayValue.toLocaleString()}
                  </h3>
                  {c.example ? (
                    <motion.p
                      key={c.example}
                      className="mt-3 font-body text-sm italic leading-relaxed text-text/80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                    >
                      {c.exampleHref ? (
                        <Link
                          href={c.exampleHref}
                          className="text-link underline decoration-border-subtle/80 underline-offset-2 transition hover:text-link-hover hover:decoration-link/50"
                        >
                          {c.example}
                        </Link>
                      ) : (
                        c.example
                      )}
                    </motion.p>
                  ) : null}
                  <StatCardDonut
                    chart={chart}
                    pending={isPending}
                    className="mt-3"
                    variant={
                      chart.variant ??
                      (c.key === "families"
                        ? "line"
                        : c.key === "places"
                          ? "bar"
                          : c.key === "individuals"
                            ? "staggered"
                            : "donut")
                    }
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
