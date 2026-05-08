"use client";

import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { CHART_STRATEGY_META } from "./chartStrategyMeta";

export function resolveChartStrategyName(
  value: ChartViewStrategyName | string | null | undefined
): ChartViewStrategyName {
  switch (value) {
    case "pedigree":
    case "vertical_pedigree":
    case "fan_chart":
    case "descendancy":
      return value;
    default:
      return "descendancy";
  }
}

export function isAncestorChartStrategy(name: ChartViewStrategyName): boolean {
  return CHART_STRATEGY_META[name].isAncestorChart;
}

export function usesPedigreeFamcStrategy(name: ChartViewStrategyName): boolean {
  return CHART_STRATEGY_META[name].usesPedigreeFamc;
}

export function usesPedigreeActionSet(name: ChartViewStrategyName): boolean {
  return name === "pedigree" || name === "vertical_pedigree" || name === "fan_chart";
}

export function isPedigreeTreeStrategy(name: ChartViewStrategyName): boolean {
  return name === "pedigree" || name === "vertical_pedigree";
}

export function isFanChartStrategy(name: ChartViewStrategyName): boolean {
  return name === "fan_chart";
}

export function isDescendancyStrategy(name: ChartViewStrategyName): boolean {
  return name === "descendancy";
}

export function getChartStrategyLabel(name: ChartViewStrategyName): string {
  return CHART_STRATEGY_META[name].displayLabel;
}

export function resolvePedigreeActionStrategy(
  name: ChartViewStrategyName
): "pedigree" | "vertical_pedigree" | "fan_chart" | null {
  if (name === "pedigree") return "pedigree";
  if (name === "vertical_pedigree") return "vertical_pedigree";
  if (name === "fan_chart") return "fan_chart";
  return null;
}
