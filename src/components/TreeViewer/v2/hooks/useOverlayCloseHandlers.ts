"use client";

import { useCallback } from "react";
import { dispatchRefreshViewport } from "../utils/viewportRefresh";

export interface UseOverlayCloseHandlersParams {
  closeSpouseDrawer: () => void;
  setGoToPersonDrawerOpen: (open: boolean) => void;
}

export function useOverlayCloseHandlers({
  closeSpouseDrawer,
  setGoToPersonDrawerOpen,
}: UseOverlayCloseHandlersParams) {
  const onCloseSpouseDrawer = useCallback(() => {
    closeSpouseDrawer();
    dispatchRefreshViewport();
  }, [closeSpouseDrawer]);

  const onCloseGoToPersonDrawer = useCallback(() => {
    setGoToPersonDrawerOpen(false);
    dispatchRefreshViewport();
  }, [setGoToPersonDrawerOpen]);

  return { onCloseSpouseDrawer, onCloseGoToPersonDrawer };
}
