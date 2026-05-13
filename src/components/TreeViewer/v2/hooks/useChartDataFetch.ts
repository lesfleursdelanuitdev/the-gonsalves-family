"use client";

import { useCallback, useEffect } from "react";
import {
  useChartViewFetch,
  type ChartViewStrategyName,
  type SiblingView,
  type TreeAction,
} from "@/genealogy-visualization-engine";
import type { LoadFamiliesAsChildFn } from "./useFamilyTreeActions";

export interface UseChartDataFetchParams {
  chartStrategy: ChartViewStrategyName;
  rootId: string;
  chartFetchDepth: number;
  siblingViewPersonId: string | null | undefined;
  pedigreeFamcFromState: string | null;
  pedigreeFamcOverridesForFetch: Record<string, string> | null;
  isAncestorChart: boolean;
  dispatch: (action: TreeAction) => void;
  loadFamiliesAsChild: LoadFamiliesAsChildFn;
}

export function useChartDataFetch({
  chartStrategy,
  rootId,
  chartFetchDepth,
  siblingViewPersonId,
  pedigreeFamcFromState,
  pedigreeFamcOverridesForFetch,
  isAncestorChart,
  dispatch,
  loadFamiliesAsChild,
}: UseChartDataFetchParams) {
  const onSiblingViewMeta = useCallback(
    (siblingView: SiblingView) => {
      dispatch({ type: "SET_SIBLING_VIEW_FROM_API", siblingView });
    },
    [dispatch]
  );

  const { isChartLoading, chartDataKey, chartAdapter, pedigreeMultiFamilyChildXrefs } =
    useChartViewFetch(
      chartStrategy,
      rootId,
      chartFetchDepth,
      siblingViewPersonId,
      onSiblingViewMeta,
      pedigreeFamcFromState,
      pedigreeFamcOverridesForFetch
    );

  /** Warm cache so "Choose parent family" opens instantly for multi-family nodes on the pedigree. */
  useEffect(() => {
    if (!isAncestorChart) return;
    for (const xref of pedigreeMultiFamilyChildXrefs ?? []) {
      void loadFamiliesAsChild(xref);
    }
  }, [isAncestorChart, pedigreeMultiFamilyChildXrefs, loadFamiliesAsChild]);

  return {
    isChartLoading,
    chartDataKey,
    chartAdapter,
    pedigreeMultiFamilyChildXrefs,
  };
}
