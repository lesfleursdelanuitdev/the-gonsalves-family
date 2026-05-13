"use client";

import type { UseFamilyTreeViewportInteractionsParams } from "./useFamilyTreeViewportInteractions";

export interface UseFamilyTreeViewportInteractionsInputParams {
  svgRef: UseFamilyTreeViewportInteractionsParams["panZoomParams"]["svgRef"];
  bounds: UseFamilyTreeViewportInteractionsParams["panZoomParams"]["bounds"];
  baseX: number;
  baseY: number;
  root: UseFamilyTreeViewportInteractionsParams["panToPersonParams"]["root"];
  chartStrategy: UseFamilyTreeViewportInteractionsParams["viewportPolicyParams"]["chartStrategy"];
  effectiveRootId: string;
  viewState: UseFamilyTreeViewportInteractionsParams["viewportPolicyParams"]["viewState"];
}

export function useFamilyTreeViewportInteractionsInput({
  svgRef,
  bounds,
  baseX,
  baseY,
  root,
  chartStrategy,
  effectiveRootId,
  viewState,
}: UseFamilyTreeViewportInteractionsInputParams): UseFamilyTreeViewportInteractionsParams {
  return {
    panZoomParams: {
      svgRef,
      bounds,
      baseX,
      baseY,
    },
    panToPersonParams: {
      root,
      bounds: bounds ?? undefined,
    },
    viewportPolicyParams: {
      chartStrategy,
      effectiveRootId,
      bounds,
      viewState,
    },
  };
}
