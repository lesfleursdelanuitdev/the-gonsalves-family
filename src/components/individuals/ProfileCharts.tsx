import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, GitBranch, PieChart } from "lucide-react";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { profileChartDescription, profileChartOpenLabel } from "@/lib/profile-chart-copy";
import { PROFILE_CHART_OPTIONS, profileChartHref } from "@/lib/profile-chart-options";

const CHART_ICONS: Record<ChartViewStrategyName, typeof GitBranch> = {
  descendancy: ArrowDown,
  vertical_pedigree: ArrowUp,
  pedigree: ArrowRight,
  fan_chart: PieChart,
};

function chartIcon(chart: ChartViewStrategyName) {
  return CHART_ICONS[chart] ?? GitBranch;
}

export function ProfileCharts({
  xref,
  fullName,
}: {
  xref: string;
  fullName: string;
}) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      {PROFILE_CHART_OPTIONS.map((option) => {
        const Icon = chartIcon(option.chart);
        const href = profileChartHref({
          rootXref: xref,
          chart: option.chart,
          rootName: fullName,
        });
        return (
          <Link
            key={option.chart}
            href={href}
            className="group flex min-w-0 flex-col rounded-2xl border border-border-subtle/80 bg-surface/90 p-5 shadow-[0_8px_24px_rgba(60,45,25,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-link/35 hover:shadow-[0_14px_30px_rgba(60,45,25,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-link/20 bg-link-soft-bg text-link transition group-hover:bg-link group-hover:text-primary-foreground">
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="mt-4 font-heading text-xl font-semibold text-heading group-hover:text-link">
              {option.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              {profileChartDescription(option.chart, fullName)}
            </p>
            <p className="mt-4 text-sm font-semibold text-link">
              {profileChartOpenLabel(option.chart, fullName)} <span aria-hidden>&rarr;</span>
            </p>
          </Link>
        );
      })}
    </div>
  );
}
