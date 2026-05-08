"use client";

import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";

export type ChartFetchDepthKind = "pedigree_capped" | "descendancy";
export type PersonDisplayFamily = "tree" | "fan";

export interface ChartStrategyMeta {
  isAncestorChart: boolean;
  usesPedigreeFamc: boolean;
  fetchDepthKind: ChartFetchDepthKind;
  treeNodeViewStrategyKey: ChartViewStrategyName;
  personDisplayFamily: PersonDisplayFamily;
  displayLabel: string;
}

export const CHART_STRATEGY_META: Record<ChartViewStrategyName, ChartStrategyMeta> = {
  descendancy: {
    isAncestorChart: false,
    usesPedigreeFamc: false,
    fetchDepthKind: "descendancy",
    treeNodeViewStrategyKey: "descendancy",
    personDisplayFamily: "tree",
    displayLabel: "Descendants",
  },
  pedigree: {
    isAncestorChart: true,
    usesPedigreeFamc: true,
    fetchDepthKind: "pedigree_capped",
    treeNodeViewStrategyKey: "pedigree",
    personDisplayFamily: "tree",
    displayLabel: "Pedigree",
  },
  vertical_pedigree: {
    isAncestorChart: true,
    usesPedigreeFamc: true,
    fetchDepthKind: "pedigree_capped",
    treeNodeViewStrategyKey: "vertical_pedigree",
    personDisplayFamily: "tree",
    displayLabel: "Vertical Pedigree",
  },
  fan_chart: {
    isAncestorChart: true,
    usesPedigreeFamc: true,
    fetchDepthKind: "pedigree_capped",
    treeNodeViewStrategyKey: "fan_chart",
    personDisplayFamily: "fan",
    displayLabel: "Fan Chart",
  },
};
