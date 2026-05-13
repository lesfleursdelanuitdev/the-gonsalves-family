"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ChartViewStrategyName, ViewState } from "@/genealogy-visualization-engine";
import { isPedigreeTreeStrategy } from "../chartStrategy";

export interface UseChartViewportPolicyParams {
  chartStrategy: ChartViewStrategyName;
  effectiveRootId: string;
  bounds: { minX: number; maxX: number; maxY: number } | null;
  viewState: ViewState;
  goToInitialView: () => void;
  centerOnPerson: (personId: string) => void;
  scheduleCenterOnPerson: (personId: string) => void;
}

export interface ChartViewportPolicy {
  handleChartHomeView: () => void;
  skipNextGoToInitialViewRef: React.MutableRefObject<boolean>;
}

export function useChartViewportPolicy({
  chartStrategy,
  effectiveRootId,
  bounds,
  viewState,
  goToInitialView,
  centerOnPerson,
  scheduleCenterOnPerson,
}: UseChartViewportPolicyParams): ChartViewportPolicy {
  const handleChartHomeView = useCallback(() => {
    if (isPedigreeTreeStrategy(chartStrategy)) {
      centerOnPerson(effectiveRootId);
      return;
    }
    goToInitialView();
  }, [chartStrategy, centerOnPerson, effectiveRootId, goToInitialView]);

  const boundsKey = bounds
    ? `${bounds.minX},${bounds.maxX},${bounds.maxY}`
    : "";
  const skipNextGoToInitialViewRef = useRef(false);
  const panToPersonId = viewState.panToPersonId;

  // Descendancy (and other non-pedigree): frame layout origin like root at (0,0) after base transform.
  useEffect(() => {
    if (isPedigreeTreeStrategy(chartStrategy)) return;
    if (skipNextGoToInitialViewRef.current) {
      skipNextGoToInitialViewRef.current = false;
      return;
    }
    if (panToPersonId) return;
    goToInitialView();
  }, [effectiveRootId, viewState, goToInitialView, boundsKey, panToPersonId, chartStrategy]);

  // Horizontal / vertical pedigree: center viewport on the proband using laid-out node coordinates.
  useEffect(() => {
    if (!isPedigreeTreeStrategy(chartStrategy)) return;
    if (panToPersonId) return;
    if (!bounds) return;
    scheduleCenterOnPerson(effectiveRootId);
  }, [chartStrategy, boundsKey, effectiveRootId, panToPersonId, bounds, scheduleCenterOnPerson]);

  useEffect(() => {
    if (!panToPersonId || !bounds) return;
    centerOnPerson(panToPersonId);
    // boundsKey (not bounds) to avoid re-run on every bounds object reference change
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on boundsKey for layout readiness
  }, [panToPersonId, boundsKey, centerOnPerson]);

  return { handleChartHomeView, skipNextGoToInitialViewRef };
}
