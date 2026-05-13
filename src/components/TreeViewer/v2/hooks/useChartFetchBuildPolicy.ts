"use client";

import { useMemo } from "react";
import { DEFAULT_MAX_DEPTH, DEFAULT_PEDIGREE_DEPTH } from "@/genealogy-visualization-engine";
import type { ChartViewStrategyName, ViewState } from "@/genealogy-visualization-engine";
import { normalizeGedcomXref } from "../PersonDetailOverlay/utils";
import { usesPedigreeFamcStrategy } from "../chartStrategy";

export interface UseChartFetchBuildPolicyParams {
  chartStrategy: ChartViewStrategyName;
  isAncestorChart: boolean;
  effectiveRootId: string;
  viewState: ViewState;
}

export interface ChartFetchBuildPolicy {
  pedigreeFamcFromState: string | null;
  pedigreeFamcOverridesForFetch: Record<string, string> | null;
  chartFetchDepth: number;
  effectiveBuildDepth: number;
  pedigreeHasRoomToExpandDepth: boolean;
}

export function useChartFetchBuildPolicy({
  chartStrategy,
  isAncestorChart,
  effectiveRootId,
  viewState,
}: UseChartFetchBuildPolicyParams): ChartFetchBuildPolicy {
  const pedigreeFamcFromState =
    usesPedigreeFamcStrategy(chartStrategy)
      ? (viewState.pedigreeFamcFamilyXref ?? null)
      : null;

  /** Non-root FAMC overrides only — root uses `pedigreeFamcFromState` (`famc=` query param). */
  const pedigreeFamcOverridesForFetch = useMemo(() => {
    if (!isAncestorChart) return null;
    const raw = viewState.pedigreeFamcOverrides;
    if (!raw || Object.keys(raw).length === 0) return null;
    const rootNorm = normalizeGedcomXref(effectiveRootId);
    const next: Record<string, string> = { ...raw };
    for (const k of Object.keys(next)) {
      if (normalizeGedcomXref(k) === rootNorm) delete next[k];
    }
    return Object.keys(next).length > 0 ? next : null;
  }, [isAncestorChart, viewState.pedigreeFamcOverrides, effectiveRootId]);

  const effectiveFetchDepth = Math.max(
    viewState.currentDepth ?? DEFAULT_MAX_DEPTH,
    viewState.displayDepth ?? 0
  );
  const chartFetchDepth =
    isAncestorChart
      ? Math.min(Math.max(effectiveFetchDepth, 1), DEFAULT_PEDIGREE_DEPTH)
      : effectiveFetchDepth;

  const effectiveBuildDepthRaw =
    viewState.currentDepth ?? viewState.displayDepth ?? DEFAULT_MAX_DEPTH;
  const effectiveBuildDepth =
    isAncestorChart
      ? Math.min(effectiveBuildDepthRaw, DEFAULT_PEDIGREE_DEPTH)
      : effectiveBuildDepthRaw;
  const pedigreeHasRoomToExpandDepth =
    isAncestorChart &&
    effectiveBuildDepth < DEFAULT_PEDIGREE_DEPTH;

  return {
    pedigreeFamcFromState,
    pedigreeFamcOverridesForFetch,
    chartFetchDepth,
    effectiveBuildDepth,
    pedigreeHasRoomToExpandDepth,
  };
}
