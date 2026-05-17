"use client";

import { useMemo } from "react";
import {
  isAllSpousesRevealed,
  type ChartViewStrategyName,
  type TreeAction,
  type ViewState,
} from "@/genealogy-visualization-engine";
import { isDescendancyStrategy } from "../chartStrategy";

export interface UseToggleAllSpousesActionParams {
  chartStrategy: ChartViewStrategyName;
  revealedUnions: ViewState["revealedUnions"];
  rootId: string;
  dispatch: (action: TreeAction) => void;
}

export function useToggleAllSpousesAction({
  chartStrategy,
  revealedUnions,
  rootId,
  dispatch,
}: UseToggleAllSpousesActionParams) {
  return useMemo(() => {
    if (!isDescendancyStrategy(chartStrategy)) return undefined;
    return () => {
      dispatch({
        type: isAllSpousesRevealed(revealedUnions, rootId)
          ? "CLOSE_ALL_SPOUSES"
          : "REVEAL_ALL_SPOUSES",
      });
    };
  }, [chartStrategy, revealedUnions, rootId, dispatch]);
}
