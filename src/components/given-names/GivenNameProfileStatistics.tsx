"use client";

import { StatCardDonut } from "@/components/homepage/Statistics/StatCardDonut";
import type { GivenNameStatisticsPayload } from "@/lib/given-names/build-given-name-statistics";
import type { HomeStatDonutChart } from "@/types/tree";

const CREAM = "#F2EBE0";
const CRIMSON = "#8B2E2E";

type StatKey = keyof GivenNameStatisticsPayload["charts"];

const STAT_LABELS: Record<StatKey, string> = {
  gender: "Gender",
  lifeStatus: "Life status",
  birthEra: "Birth era",
  birthPlaces: "Birth places",
};

export function GivenNameProfileStatistics({ statistics }: { statistics: GivenNameStatisticsPayload }) {
  const cards: { key: StatKey; chart: HomeStatDonutChart }[] = [
    { key: "gender", chart: statistics.charts.gender },
    { key: "lifeStatus", chart: statistics.charts.lifeStatus },
    { key: "birthEra", chart: statistics.charts.birthEra },
    { key: "birthPlaces", chart: statistics.charts.birthPlaces },
  ];

  return (
    <section
      className="w-full max-w-full min-w-0 overflow-x-hidden border-y border-black/[0.06]"
      style={{ backgroundColor: CREAM }}
    >
      <div className="mx-auto w-full min-w-0 max-w-[min(100%,1680px)] px-5 py-8 sm:px-6 md:px-8 md:py-10 lg:px-10">
        <div className="mb-6 w-full">
          <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] md:text-xs" style={{ color: CRIMSON }}>
            By the numbers
          </p>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#1a1612] sm:text-3xl">
            People with this given name in our records
          </h2>
          <p className="mt-2 font-body text-sm leading-relaxed text-[#5c5348] md:text-base">
            Distributions for everyone in the tree whose GEDCOM name includes this given name.
          </p>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-4">
          {cards.map((c) => (
            <div
              key={c.key}
              className="relative flex w-full min-w-0 flex-col overflow-hidden rounded-sm border border-border-subtle/80 bg-surface-elevated/90 shadow-[0_10px_24px_rgba(60,45,25,0.08)]"
            >
              <div className="relative flex h-16 shrink-0 items-center justify-start overflow-hidden border-b border-border-subtle/35 bg-transparent px-3 sm:h-[3.75rem] sm:px-4">
                <p className="bg-crimson px-3 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm sm:px-4 sm:py-2 sm:text-sm sm:tracking-[0.22em]">
                  {STAT_LABELS[c.key]}
                </p>
              </div>
              <div className="flex min-h-0 flex-col px-4 py-4">
                <h3 className="font-heading text-3xl font-semibold tabular-nums text-heading sm:text-4xl md:text-[2.25rem]">
                  {statistics.peopleCount.toLocaleString()}
                </h3>
                <p className="mt-3 font-body text-sm italic leading-relaxed text-text/80">
                  {STAT_LABELS[c.key]} for this given name
                </p>
                <StatCardDonut chart={c.chart} className="mt-3" variant={c.chart.variant} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
