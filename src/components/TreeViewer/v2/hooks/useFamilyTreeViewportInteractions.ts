"use client";

import { usePanToPerson, usePanZoom } from "@/genealogy-visualization-engine";
import { isPedigreeTreeStrategy } from "../chartStrategy";
import { useChartViewportPolicy } from "./useChartViewportPolicy";

export interface UseFamilyTreeViewportInteractionsParams {
  panZoomParams: Parameters<typeof usePanZoom>[0];
  panToPersonParams: Omit<Parameters<typeof usePanToPerson>[0], "centerOnPosition">;
  viewportPolicyParams: Omit<
    Parameters<typeof useChartViewportPolicy>[0],
    "goToInitialView" | "centerOnPerson" | "scheduleCenterOnPerson"
  >;
}

export function useFamilyTreeViewportInteractions({
  panZoomParams,
  panToPersonParams,
  viewportPolicyParams,
}: UseFamilyTreeViewportInteractionsParams) {
  const panZoom = usePanZoom({
    ...panZoomParams,
    deferLayoutOriginInitialPan: isPedigreeTreeStrategy(
      viewportPolicyParams.chartStrategy
    ),
  });

  const { centerOnPerson, scheduleCenterOnPerson } = usePanToPerson({
    ...panToPersonParams,
    centerOnPosition: panZoom.centerOnPosition,
  });

  const { handleChartHomeView, skipNextGoToInitialViewRef } = useChartViewportPolicy({
    ...viewportPolicyParams,
    goToInitialView: panZoom.goToInitialView,
    centerOnPerson,
    scheduleCenterOnPerson,
  });

  return {
    ...panZoom,
    centerOnPerson,
    scheduleCenterOnPerson,
    handleChartHomeView,
    skipNextGoToInitialViewRef,
  };
}
