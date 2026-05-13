"use client";

import { useCallback } from "react";
import { dispatchRefreshViewport } from "../utils/viewportRefresh";

export interface UseGoToPersonSelectionParams {
  centerOnPosition: (layoutX: number, layoutY: number) => void;
  centerOnPerson: (personId: string) => void;
  setGoToPersonDrawerOpen: (open: boolean) => void;
}

export function useGoToPersonSelection({
  centerOnPosition,
  centerOnPerson,
  setGoToPersonDrawerOpen,
}: UseGoToPersonSelectionParams) {
  return useCallback(
    (personId: string, layoutX?: number, layoutY?: number) => {
      if (layoutX != null && layoutY != null) {
        centerOnPosition(layoutX, layoutY);
      } else {
        centerOnPerson(personId);
      }
      setGoToPersonDrawerOpen(false);
      dispatchRefreshViewport();
    },
    [centerOnPosition, centerOnPerson, setGoToPersonDrawerOpen]
  );
}
