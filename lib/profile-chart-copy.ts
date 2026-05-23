import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";

/** Prefer a given name for warm copy; fall back to the full name or a neutral label. */
export function profileChartPersonLabel(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "this person";
  const first = trimmed.split(/\s+/)[0];
  return first || trimmed;
}

/** Short call-to-action on each chart card. */
export function profileChartOpenLabel(chart: ChartViewStrategyName, fullName: string): string {
  const name = profileChartPersonLabel(fullName);
  switch (chart) {
    case "descendancy":
      return `Open ${name}'s descendancy chart`;
    case "vertical_pedigree":
      return `Open ${name}'s vertical pedigree`;
    case "pedigree":
      return `Open ${name}'s pedigree`;
    case "fan_chart":
      return `Open ${name}'s fan chart`;
    default:
      return `Open ${name}'s chart in the tree viewer`;
  }
}
