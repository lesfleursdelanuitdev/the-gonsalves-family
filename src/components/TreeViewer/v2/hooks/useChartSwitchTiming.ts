"use client";

import { useLayoutEffect } from "react";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import {
  chartSwitchMarkFirstChartPaint,
  chartSwitchTimingEnabled,
} from "@/genealogy-visualization-engine/debug/chartSwitchTiming";

export interface UseChartSwitchTimingParams {
  chartAdapter: unknown;
  isChartLoading: boolean;
  chartStrategy: ChartViewStrategyName;
  chartDataKey: NonNullable<Parameters<typeof chartSwitchMarkFirstChartPaint>[0]>["chartDataKey"];
}

/**
 * Ends `handler→firstPaint` after the new adapter + non-loading state have committed (before browser paint).
 */
export function useChartSwitchTiming({
  chartAdapter,
  isChartLoading,
  chartStrategy,
  chartDataKey,
}: UseChartSwitchTimingParams) {
  useLayoutEffect(() => {
    if (!chartSwitchTimingEnabled()) return;
    if (chartAdapter == null || isChartLoading) return;
    chartSwitchMarkFirstChartPaint({ chartStrategy, chartDataKey });
  }, [chartAdapter, isChartLoading, chartStrategy, chartDataKey]);
}
