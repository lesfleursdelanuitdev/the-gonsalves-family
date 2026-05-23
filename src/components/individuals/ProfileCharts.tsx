"use client";

import { useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, PieChart } from "lucide-react";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { IndividualChartEmbed } from "./IndividualChartEmbed";

type ChartTab = "pedigree" | "descendancy" | "fan_chart" | "vertical_pedigree";

const CHART_TABS: Array<{ id: ChartTab; label: string; Icon: typeof ArrowRight }> = [
  { id: "pedigree", label: "Pedigree", Icon: ArrowRight },
  { id: "descendancy", label: "Descendancy", Icon: ArrowDown },
  { id: "fan_chart", label: "Fan Chart", Icon: PieChart },
  { id: "vertical_pedigree", label: "Vertical Pedigree", Icon: ArrowUp },
];

export function ProfileCharts({
  xref,
  fullName,
}: {
  xref: string;
  fullName: string;
}) {
  const [activeTab, setActiveTab] = useState<ChartTab>("pedigree");

  return (
    <div className="mt-5 min-w-0">
      <div className="mb-4 flex flex-wrap gap-1.5 rounded-xl border border-border-subtle bg-bg/60 p-1 sm:inline-flex sm:gap-2">
        {CHART_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            aria-pressed={activeTab === id}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.11em] transition sm:gap-2 sm:text-xs sm:tracking-[0.12em] ${
              activeTab === id
                ? "bg-link text-primary-foreground shadow-[0_6px_16px_rgba(31,90,56,0.18)]"
                : "text-link hover:bg-link-soft-bg hover:text-link-soft-fg"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <IndividualChartEmbed
        key={activeTab}
        xref={xref}
        chart={activeTab as ChartViewStrategyName}
        fullName={fullName}
      />
    </div>
  );
}
