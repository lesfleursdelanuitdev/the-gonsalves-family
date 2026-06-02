"use client";

import { useDepth, useTreeBuild, type TreeAction, type ViewState } from "@/genealogy-visualization-engine";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import type { ChartSettingsV2 } from "../ChartPanels/SettingsPanel";
import { getEffectivePersonHeight } from "@/lib/personNodeHeight";

export interface UseChartLayoutDepthParams {
  dispatch: (action: TreeAction) => void;
  viewState: ViewState;
  chartAdapter: Parameters<typeof useTreeBuild>[0]["chartAdapter"];
  chartDataKey: Parameters<typeof useTreeBuild>[0]["chartDataKey"];
  isAncestorChart: boolean;
  chartStrategy: ChartViewStrategyName;
  isMobile: boolean;
  effectiveRootId: string;
  effectiveBuildDepth: number;
  settings: Pick<ChartSettingsV2, "parentPairGap" | "pedigreeConnectorCxWidth" | "compactCardWidth"> & Partial<ChartSettingsV2>;
  showRootSiblings?: boolean;
}

export function useChartLayoutDepth({
  dispatch,
  viewState,
  chartAdapter,
  chartDataKey,
  isAncestorChart,
  chartStrategy,
  isMobile,
  effectiveRootId,
  effectiveBuildDepth,
  settings,
  showRootSiblings,
}: UseChartLayoutDepthParams) {
  const effectivePersonHeight = getEffectivePersonHeight(settings, {
    chartStrategy,
    isMobile,
  });

  const { root, baseX, baseY, bounds, maxDepthRendered } = useTreeBuild({
    effectiveRootId,
    viewState,
    maxDepth: effectiveBuildDepth,
    chartDataKey,
    chartAdapter,
    effectivePersonHeight,
    parentPairGap: settings.parentPairGap,
    pedigreeGenerationGap: settings.pedigreeConnectorCxWidth,
    personWidth: settings.compactCardWidth,
    showRootSiblings,
  });

  const depth = useDepth({
    dispatch,
    viewState,
    maxDepthRendered,
    builder: chartAdapter?.getDataBuilder() ?? null,
    disableRenderedDepthSync: isAncestorChart,
  });

  return {
    effectivePersonHeight,
    root,
    baseX,
    baseY,
    bounds,
    ...depth,
  };
}
