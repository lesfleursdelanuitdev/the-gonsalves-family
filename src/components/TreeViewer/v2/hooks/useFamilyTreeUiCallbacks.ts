"use client";

import { useCallback } from "react";

interface PanelsApi {
  setShowLegendPanel: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowDebugPanel: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowHistoryPanel: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowInfo: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowSettings: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowLegendModal: (v: boolean | ((p: boolean) => boolean)) => void;
}

export interface UseFamilyTreeUiCallbacksParams {
  panels: PanelsApi;
  setToast: (toast: { title: string; parts: { pedi: string; names: string }[] } | null) => void;
}

export function useFamilyTreeUiCallbacks({ panels, setToast }: UseFamilyTreeUiCallbacksParams) {
  const dismissToast = useCallback(() => setToast(null), [setToast]);

  const toggleLegendPanel = useCallback(
    () => panels.setShowLegendPanel((p) => !p),
    [panels]
  );
  const toggleDebugPanel = useCallback(
    () => panels.setShowDebugPanel((p) => !p),
    [panels]
  );

  const closeDebugPanel = useCallback(() => panels.setShowDebugPanel(false), [panels]);
  const closeHistoryPanel = useCallback(() => panels.setShowHistoryPanel(false), [panels]);
  const closeInfoPanel = useCallback(() => panels.setShowInfo(false), [panels]);
  const closeSettingsPanel = useCallback(() => panels.setShowSettings(false), [panels]);
  const closeLegendPanel = useCallback(() => panels.setShowLegendPanel(false), [panels]);
  const closeLegendModal = useCallback(() => panels.setShowLegendModal(false), [panels]);

  return {
    dismissToast,
    toggleLegendPanel,
    toggleDebugPanel,
    closeDebugPanel,
    closeHistoryPanel,
    closeInfoPanel,
    closeSettingsPanel,
    closeLegendPanel,
    closeLegendModal,
  };
}
