"use client";

import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import {
  getChartStrategyCapabilities,
  getPersonDisplayFamilyForStrategy,
  isAncestorChartStrategy,
  resolveChartStrategyName,
  resolveTreeNodeViewStrategyKey,
  type TreeNodeViewStrategyKey,
} from "../chartStrategy";

export interface UseFamilyTreeStrategyStateParams {
  strategyName: string;
}

export interface FamilyTreeStrategyState {
  chartStrategy: ChartViewStrategyName;
  isAncestorChart: boolean;
  allowsPedigreeRootExpansion: boolean;
  personDisplayFamily: "tree" | "fan";
  isFanDisplayFamily: boolean;
  treeNodeViewStrategyKey: TreeNodeViewStrategyKey;
}

export function useFamilyTreeStrategyState({
  strategyName,
}: UseFamilyTreeStrategyStateParams): FamilyTreeStrategyState {
  const chartStrategy = resolveChartStrategyName(strategyName);
  const isAncestorChart = isAncestorChartStrategy(chartStrategy);
  const allowsPedigreeRootExpansion =
    getChartStrategyCapabilities(chartStrategy).allowsPedigreeRootExpansion;
  const personDisplayFamily = getPersonDisplayFamilyForStrategy(chartStrategy);
  const isFanDisplayFamily = personDisplayFamily === "fan";
  const treeNodeViewStrategyKey = resolveTreeNodeViewStrategyKey(chartStrategy);

  return {
    chartStrategy,
    isAncestorChart,
    allowsPedigreeRootExpansion,
    personDisplayFamily,
    isFanDisplayFamily,
    treeNodeViewStrategyKey,
  };
}
