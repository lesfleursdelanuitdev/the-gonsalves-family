"use client";

import { useCallback, useMemo } from "react";
import {
  DEFAULT_MAX_DEPTH,
  handlePersonCardAction,
  type PersonCardAction,
  type HandlePersonCardActionContext,
} from "@/descendancy-chart";
import type { ViewState } from "@/descendancy-chart";
import type { TreeAction } from "@/descendancy-chart";
import { dispatchRefreshViewport } from "../utils/viewportRefresh";
import type { ChartSettingsV2 } from "../ChartPanels/SettingsPanel";
import type { ToastState } from "./useFamilyTreeState";

export interface UseFamilyTreeActionsParams {
  dispatch: (action: TreeAction) => void;
  viewState: ViewState;
  settings: ChartSettingsV2;
  panels: {
    setShowLegendModal: (v: boolean | ((p: boolean) => boolean)) => void;
    setShowLegendPanel: (v: boolean | ((p: boolean) => boolean)) => void;
    setShowSearchPanel: (v: boolean | ((p: boolean) => boolean)) => void;
    setShowDepthPanel: (v: boolean | ((p: boolean) => boolean)) => void;
  };
  search: {
    setSearchGivenName: (v: string) => void;
    setSearchLastName: (v: string) => void;
  };
  spouseDrawer: { closeDrawer: () => void; setDrawerPersonId: (id: string | null) => void };
  currentDepthRendered: number;
  atMaxDepth: boolean;
  effectiveMaxDepth: number;
  handleMaxDepthChange: (n: number) => void;
  displayedDepth: number;
  setPan: (pan: { x: number; y: number }) => void;
  goToInitialView: () => void;
  setToast: (t: ToastState) => void;
  setRootDisplayNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  scheduleCenterOnPerson: (personId: string) => void;
  effectiveRootId: string;
  triggerBlinkBack: () => void;
  /** When set to true before a re-render, the next goToInitialView effect run will be skipped (e.g. after revealing a spouse so we center on the spouse instead). */
  skipNextGoToInitialViewRef: React.MutableRefObject<boolean>;
  /** When person P has more spouses to open, open this modal so user can choose to pan to the newly opened partner. */
  openPanToPartnerModal: (spouseId: string) => void;
}

export interface RootActionDeps {
  dispatch: (action: TreeAction) => void;
  setRootDisplayNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onCloseDrawer: () => void;
  setPan: (pan: { x: number; y: number }) => void;
  triggerBlinkBack: () => void;
  onGoToInitialView: () => void;
  clearSearchAndClosePanel: () => void;
}

export function useFamilyTreeActions(params: UseFamilyTreeActionsParams) {
  const {
    dispatch,
    viewState,
    settings,
    panels,
    search,
    spouseDrawer,
    currentDepthRendered,
    atMaxDepth,
    effectiveMaxDepth: _effectiveMaxDepth,
    handleMaxDepthChange: _handleMaxDepthChange,
    displayedDepth: _displayedDepth,
    setPan,
    goToInitialView,
    setToast,
    setRootDisplayNames,
    scheduleCenterOnPerson,
    effectiveRootId,
    triggerBlinkBack,
    skipNextGoToInitialViewRef,
    openPanToPartnerModal,
  } = params;

  const onActionContext: HandlePersonCardActionContext = useMemo(
    () => ({
      dispatch,
      setDrawerPersonId: spouseDrawer.setDrawerPersonId,
      setPan,
      setToast,
      setShowLegendModal: panels.setShowLegendModal,
      setShowLegendPanel: panels.setShowLegendPanel,
      setRootDisplayNames,
      triggerBlinkBack,
      settings,
      currentDepth: currentDepthRendered,
      atMaxDepth,
      maxDepth: DEFAULT_MAX_DEPTH,
      rootId: effectiveRootId,
      viewState,
      scheduleCenterOnPerson,
    }),
    [
      dispatch,
      spouseDrawer.setDrawerPersonId,
      setPan,
      setToast,
      panels.setShowLegendModal,
      panels.setShowLegendPanel,
      setRootDisplayNames,
      triggerBlinkBack,
      settings,
      currentDepthRendered,
      atMaxDepth,
      effectiveRootId,
      viewState,
      scheduleCenterOnPerson,
    ]
  );

  const onAction = useCallback(
    (action: PersonCardAction, personId: string) => {
      handlePersonCardAction(action, personId, onActionContext);
    },
    [onActionContext]
  );

  const onDrawerSelect = useCallback(
    (personId: string, spouseId: string) => {
      skipNextGoToInitialViewRef.current = true;
      dispatch({ type: "DRAWER_SELECT", personId, spouseId });
      spouseDrawer.closeDrawer();
      triggerBlinkBack();
      openPanToPartnerModal(spouseId);
    },
    [
      dispatch,
      spouseDrawer.closeDrawer,
      triggerBlinkBack,
      skipNextGoToInitialViewRef,
      openPanToPartnerModal,
    ]
  );

  const onDrawerSelectAll = useCallback(
    (personId: string, spouseIdToPanTo: string) => {
      skipNextGoToInitialViewRef.current = true;
      dispatch({ type: "DRAWER_SELECT_ALL", personId });
      spouseDrawer.closeDrawer();
      triggerBlinkBack();
      openPanToPartnerModal(spouseIdToPanTo);
    },
    [
      dispatch,
      spouseDrawer.closeDrawer,
      triggerBlinkBack,
      skipNextGoToInitialViewRef,
      openPanToPartnerModal,
    ]
  );

  const onCloseSpouse = useCallback(
    (spouseId: string) => {
      dispatch({ type: "CLOSE_SPOUSE", spouseId });
    },
    [dispatch]
  );

  const onCloseAllSpouses = useCallback(
    (personId: string) => {
      dispatch({ type: "CLOSE_ALL_SPOUSES_FOR_PERSON", personId });
    },
    [dispatch]
  );

  const clearSearchAndClosePanel = useCallback(() => {
    search.setSearchGivenName("");
    search.setSearchLastName("");
    panels.setShowSearchPanel(false);
    dispatchRefreshViewport("search-database-modal");
  }, [search, panels]);

  const setShowSearchPanel = useCallback(
    (v: boolean | ((prev: boolean) => boolean)) => {
      panels.setShowSearchPanel(v);
      if (typeof v === "boolean" && !v)
        dispatchRefreshViewport("search-database-modal");
    },
    [panels]
  );

  const setShowDepthPanel = useCallback(
    (v: boolean | ((prev: boolean) => boolean)) => {
      panels.setShowDepthPanel(v);
      if (typeof v === "boolean" && !v) dispatchRefreshViewport();
    },
    [panels]
  );

  const rootActionDeps: RootActionDeps = useMemo(
    () => ({
      dispatch,
      setRootDisplayNames,
      onCloseDrawer: spouseDrawer.closeDrawer,
      setPan,
      triggerBlinkBack,
      onGoToInitialView: goToInitialView,
      clearSearchAndClosePanel,
    }),
    [
      dispatch,
      setRootDisplayNames,
      spouseDrawer.closeDrawer,
      setPan,
      triggerBlinkBack,
      goToInitialView,
      clearSearchAndClosePanel,
    ]
  );

  return {
    onAction,
    onDrawerSelect,
    onDrawerSelectAll,
    onCloseSpouse,
    onCloseAllSpouses,
    clearSearchAndClosePanel,
    setShowSearchPanel,
    setShowDepthPanel,
    rootActionDeps,
  };
}
