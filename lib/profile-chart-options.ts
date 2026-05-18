import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { DEFAULT_MAX_DEPTH } from "@/genealogy-visualization-engine";
import {
  ancestorChartHref,
  normalizeTreeViewerGedcomXref,
  TREE_VIEWER_PATH,
} from "@/lib/treeViewerUrl";

export type ProfileChartOption = {
  chart: ChartViewStrategyName;
  title: string;
};

/** Chart types offered on the public individual profile (fixed order). */
export const PROFILE_CHART_OPTIONS: ProfileChartOption[] = [
  { chart: "descendancy", title: "Descendancy" },
  { chart: "vertical_pedigree", title: "Vertical pedigree" },
  { chart: "pedigree", title: "Pedigree" },
  { chart: "fan_chart", title: "Fan chart" },
];

/** Deep link into the tree viewer for a profile chart choice. */
export function profileChartHref(args: {
  rootXref: string;
  chart: ChartViewStrategyName;
  rootName?: string | null;
}): string {
  if (args.chart === "descendancy") {
    const root = normalizeTreeViewerGedcomXref(args.rootXref);
    if (!root) return TREE_VIEWER_PATH;
    const params = new URLSearchParams({
      root,
      chart: "descendancy",
      depth: String(DEFAULT_MAX_DEPTH),
    });
    const name = args.rootName?.trim();
    if (name) params.set("rootName", name);
    return `${TREE_VIEWER_PATH}?${params.toString()}`;
  }

  if (args.chart === "pedigree" || args.chart === "vertical_pedigree" || args.chart === "fan_chart") {
    return ancestorChartHref({
      rootXref: args.rootXref,
      chartStrategy: args.chart,
      rootName: args.rootName,
    });
  }

  return TREE_VIEWER_PATH;
}
