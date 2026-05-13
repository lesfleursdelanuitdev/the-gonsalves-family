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
  dispatch: (action: TreeAction) => void;
}

export function useToggleAllSpousesAction({
  chartStrategy,
  revealedUnions,
  dispatch,
}: UseToggleAllSpousesActionParams) {
  return useMemo(() => {
    if (!isDescendancyStrategy(chartStrategy)) return undefined;
    return () => {
      dispatch({
        type: isAllSpousesRevealed(revealedUnions)
          ? "CLOSE_ALL_SPOUSES"
          : "REVEAL_ALL_SPOUSES",
      });
    };
  }, [chartStrategy, revealedUnions, dispatch]);
}
