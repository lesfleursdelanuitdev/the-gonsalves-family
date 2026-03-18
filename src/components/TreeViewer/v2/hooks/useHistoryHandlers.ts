"use client";

import { useCallback } from "react";
import type { TreeAction } from "@/genealogy-visualization-engine";

export interface UseHistoryHandlersParams {
  dispatch: (action: TreeAction) => void;
  closeDrawer: () => void;
  setPan: (pan: { x: number; y: number }) => void;
}

export interface UseHistoryHandlersResult {
  onNavigateHistory: (index: number) => void;
  onClearHistory: () => void;
}

export function useHistoryHandlers({
  dispatch,
  closeDrawer,
  setPan,
}: UseHistoryHandlersParams): UseHistoryHandlersResult {
  const onNavigateHistory = useCallback(
    (index: number) => {
      dispatch({ type: "NAVIGATE_TO_INDEX", index });
      closeDrawer();
      setPan({ x: 0, y: 0 });
    },
    [dispatch, closeDrawer, setPan]
  );

  const onClearHistory = useCallback(() => {
    dispatch({ type: "CLEAR_HISTORY" });
    closeDrawer();
    setPan({ x: 0, y: 0 });
  }, [dispatch, closeDrawer, setPan]);

  return { onNavigateHistory, onClearHistory };
}
