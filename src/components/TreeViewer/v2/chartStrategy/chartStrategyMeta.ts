"use client";

import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";

export type ChartFetchDepthKind = "pedigree_capped" | "descendancy";
export type PersonDisplayFamily = "tree" | "fan";
export type TreeNodeViewStrategyKey = "descendancy" | "pedigree" | "vertical_pedigree";
export type ChartActionSet = "descendancy" | "pedigree";
export type ChartRelationshipMode = "explicit" | "none";

export interface ChartStrategyCapabilities {
  actionSet: ChartActionSet;
  relationshipMode: ChartRelationshipMode;
  allowsPedigreeRootExpansion: boolean;
}

export interface ChartStrategyMeta {
  isAncestorChart: boolean;
  usesPedigreeFamc: boolean;
  fetchDepthKind: ChartFetchDepthKind;
  treeNodeViewStrategyKey: TreeNodeViewStrategyKey;
  personDisplayFamily: PersonDisplayFamily;
  capabilities: ChartStrategyCapabilities;
  displayLabel: string;
}

export const CHART_STRATEGY_META: Record<ChartViewStrategyName, ChartStrategyMeta> = {
  descendancy: {
    isAncestorChart: false,
    usesPedigreeFamc: false,
    fetchDepthKind: "descendancy",
    treeNodeViewStrategyKey: "descendancy",
    personDisplayFamily: "tree",
    capabilities: {
      actionSet: "descendancy",
      relationshipMode: "explicit",
      allowsPedigreeRootExpansion: false,
    },
    displayLabel: "Descendants",
  },
  pedigree: {
    isAncestorChart: true,
    usesPedigreeFamc: true,
    fetchDepthKind: "pedigree_capped",
    treeNodeViewStrategyKey: "pedigree",
    personDisplayFamily: "tree",
    capabilities: {
      actionSet: "pedigree",
      relationshipMode: "explicit",
      allowsPedigreeRootExpansion: true,
    },
    displayLabel: "Pedigree",
  },
  vertical_pedigree: {
    isAncestorChart: true,
    usesPedigreeFamc: true,
    fetchDepthKind: "pedigree_capped",
    treeNodeViewStrategyKey: "vertical_pedigree",
    personDisplayFamily: "tree",
    capabilities: {
      actionSet: "pedigree",
      relationshipMode: "explicit",
      allowsPedigreeRootExpansion: true,
    },
    displayLabel: "Vertical Pedigree",
  },
  fan_chart: {
    isAncestorChart: true,
    usesPedigreeFamc: true,
    fetchDepthKind: "pedigree_capped",
    /** Fan renders via FanChartContent; node-view lookups intentionally reuse descendancy set. */
    treeNodeViewStrategyKey: "descendancy",
    personDisplayFamily: "fan",
    capabilities: {
      actionSet: "pedigree",
      relationshipMode: "none",
      allowsPedigreeRootExpansion: false,
    },
    displayLabel: "Fan Chart",
  },
};
