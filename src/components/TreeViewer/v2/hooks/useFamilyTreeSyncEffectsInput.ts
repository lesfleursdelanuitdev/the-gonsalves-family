"use client";

import type { UseFamilyTreeSyncEffectsParams } from "./useFamilyTreeSyncEffects";

export interface UseFamilyTreeSyncEffectsInputParams {
  chartStrategy: UseFamilyTreeSyncEffectsParams["chartStrategyChangeParams"]["chartStrategy"];
  rootId: string;
  pedigreeFamcFamilyXref: string | null | undefined;
  dispatch: UseFamilyTreeSyncEffectsParams["chartStrategyChangeParams"]["dispatch"];
  loadFamiliesAsChild: UseFamilyTreeSyncEffectsParams["chartStrategyChangeParams"]["loadFamiliesAsChild"];
  chartAdapter: UseFamilyTreeSyncEffectsParams["chartSwitchTimingParams"]["chartAdapter"];
  isChartLoading: boolean;
  chartDataKey: UseFamilyTreeSyncEffectsParams["chartSwitchTimingParams"]["chartDataKey"];
  isAncestorChart: boolean;
  effectiveCurrentDepth: number;
  personCardLayout: UseFamilyTreeSyncEffectsParams["treeViewerUrlSyncParams"]["personCardLayout"];
  personCardVariant: UseFamilyTreeSyncEffectsParams["treeViewerUrlSyncParams"]["personCardVariant"];
  compactCardSize: UseFamilyTreeSyncEffectsParams["treeViewerUrlSyncParams"]["compactCardSize"];
  parentPairGap: number;
  revealedUnions: UseFamilyTreeSyncEffectsParams["treeViewerUrlSyncParams"]["revealedUnions"];
  initialPartnersUrl: UseFamilyTreeSyncEffectsParams["treeViewerUrlSyncParams"]["initialPartnersUrl"];
}

export function useFamilyTreeSyncEffectsInput({
  chartStrategy,
  rootId,
  pedigreeFamcFamilyXref,
  dispatch,
  loadFamiliesAsChild,
  chartAdapter,
  isChartLoading,
  chartDataKey,
  isAncestorChart,
  effectiveCurrentDepth,
  personCardLayout,
  personCardVariant,
  compactCardSize,
  parentPairGap,
  revealedUnions,
  initialPartnersUrl,
}: UseFamilyTreeSyncEffectsInputParams): UseFamilyTreeSyncEffectsParams {
  return {
    chartStrategyChangeParams: {
      chartStrategy,
      rootId,
      pedigreeFamcFamilyXref,
      dispatch,
      loadFamiliesAsChild,
    },
    chartSwitchTimingParams: {
      chartAdapter,
      isChartLoading,
      chartStrategy,
      chartDataKey,
    },
    treeViewerUrlSyncParams: {
      rootId,
      chartStrategy,
      isAncestorChart,
      effectiveCurrentDepth,
      personCardLayout,
      personCardVariant,
      compactCardSize,
      parentPairGap,
      pedigreeFamcFamilyXref,
      revealedUnions,
      initialPartnersUrl,
      chartAdapter,
      isChartLoading,
      dispatch,
    },
  };
}
