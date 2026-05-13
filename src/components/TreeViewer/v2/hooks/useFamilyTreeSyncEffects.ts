"use client";

import { useChartStrategyChange } from "./useChartStrategyChange";
import { useChartSwitchTiming } from "./useChartSwitchTiming";
import { useTreeViewerUrlSync } from "./useTreeViewerUrlSync";

export interface UseFamilyTreeSyncEffectsParams {
  chartStrategyChangeParams: Parameters<typeof useChartStrategyChange>[0];
  chartSwitchTimingParams: Parameters<typeof useChartSwitchTiming>[0];
  treeViewerUrlSyncParams: Parameters<typeof useTreeViewerUrlSync>[0];
}

export function useFamilyTreeSyncEffects({
  chartStrategyChangeParams,
  chartSwitchTimingParams,
  treeViewerUrlSyncParams,
}: UseFamilyTreeSyncEffectsParams) {
  const { handleChartStrategyChange } = useChartStrategyChange(chartStrategyChangeParams);

  useChartSwitchTiming(chartSwitchTimingParams);
  useTreeViewerUrlSync(treeViewerUrlSyncParams);

  return { handleChartStrategyChange };
}
