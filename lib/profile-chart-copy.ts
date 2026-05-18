import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";

/** Prefer a given name for warm copy; fall back to the full name or a neutral label. */
export function profileChartPersonLabel(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "this person";
  const first = trimmed.split(/\s+/)[0];
  return first || trimmed;
}

/** Warm, personalized blurb for each chart card on an individual profile. */
export function profileChartDescription(chart: ChartViewStrategyName, fullName: string): string {
  const name = profileChartPersonLabel(fullName);

  switch (chart) {
    case "descendancy":
      return `A descendancy chart follows a life forward in time. Open one centered on ${name} to see their children, grandchildren, and the families that grew from their story — with ${name} at the heart of the chart, branching gently downward through the generations.`;
    case "vertical_pedigree":
      return `A vertical pedigree looks back through the generations. Open ${name}'s chart to walk upward from ${name} to parents, grandparents, and the ancestors who came before — each generation stacked above the last.`;
    case "pedigree":
      return `A classic pedigree spreads ancestors from left to right. Open ${name}'s chart to explore the lines behind their name; if ${name} appears in more than one family as a child, you can choose which branch of the tree to follow.`;
    case "fan_chart":
      return `A fan chart gathers ancestors in a circle around the person you care about. Open ${name}'s fan chart to see their forebears radiating outward — a welcoming way to browse many generations at once.`;
    default:
      return `Open an interactive chart centered on ${name} in the family tree viewer.`;
  }
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
