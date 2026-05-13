"use client";

import type { ChartViewStrategyName, ViewState, TreeAction } from "@/genealogy-visualization-engine";
import type { ChartSettingsV2 } from "../ChartPanels/SettingsPanel";
import type { FanMoreClickPayload } from "../fan/fanPeekTypes";
import type { PersonDetailOverlayPerson } from "../PersonDetailOverlay";
import type { UseFamilyTreeInteractionsParams } from "./useFamilyTreeInteractions";
import type { FamiliesAsChildResponse } from "../PersonDetailOverlay/types";

interface PanelsInput {
  setShowLegendModal: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowLegendPanel: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowDebugPanel: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowHistoryPanel: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowInfo: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowSettings: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowSearchPanel: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowDepthPanel: (v: boolean | ((p: boolean) => boolean)) => void;
}

interface SearchInput {
  setSearchGivenName: (v: string) => void;
  setSearchLastName: (v: string) => void;
}

interface SpouseDrawerInput {
  closeDrawer: () => void;
  setDrawerPersonId: (id: string | null) => void;
}

export interface UseFamilyTreeInteractionsInputParams {
  chartStrategy: ChartViewStrategyName;
  dispatch: (action: TreeAction) => void;
  viewState: ViewState;
  settings: ChartSettingsV2;
  panels: PanelsInput;
  search: SearchInput;
  spouseDrawer: SpouseDrawerInput;
  currentDepthRendered: number;
  atMaxDepth: boolean;
  effectiveMaxDepth: number;
  handleMaxDepthChange: (n: number) => void;
  displayedDepth: number;
  setPan: (pan: { x: number; y: number }) => void;
  handleChartHomeView: () => void;
  setToast: (t: { title: string; parts: { pedi: string; names: string }[] } | null) => void;
  setRootDisplayNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  scheduleCenterOnPerson: (personId: string) => void;
  effectiveRootId: string;
  triggerBlinkBack: () => void;
  skipNextGoToInitialViewRef: React.MutableRefObject<boolean>;
  openPanToPartnerModal: (spouseId: string) => void;
  setPedigreeFamcPicker: React.Dispatch<
    React.SetStateAction<
      | null
      | {
          strategyName: "pedigree" | "vertical_pedigree" | "fan_chart";
          families: FamiliesAsChildResponse["familiesOfOrigin"];
          forPersonId?: string | null;
        }
    >
  >;
  loadFamiliesAsChild: (xref: string) => Promise<FamiliesAsChildResponse | null>;
  togglePedigreeRootSiblings: (personId: string) => void | Promise<void>;
  togglePedigreeRootChildren: (personId: string) => void | Promise<void>;
  isFanDisplayFamily: boolean;
  fanPeek: FanMoreClickPayload | null;
  setFanPeek: React.Dispatch<React.SetStateAction<FanMoreClickPayload | null>>;
  setPersonDetailOverlay: React.Dispatch<React.SetStateAction<PersonDetailOverlayPerson | null>>;
  setGoToPersonDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  centerOnPosition: (layoutX: number, layoutY: number) => void;
  centerOnPerson: (personId: string) => void;
  pedigreeFamcPicker: {
    strategyName: "pedigree" | "vertical_pedigree" | "fan_chart";
    families: FamiliesAsChildResponse["familiesOfOrigin"];
    forPersonId?: string | null;
  } | null;
}

export function useFamilyTreeInteractionsInput({
  chartStrategy,
  dispatch,
  viewState,
  settings,
  panels,
  search,
  spouseDrawer,
  currentDepthRendered,
  atMaxDepth,
  effectiveMaxDepth,
  handleMaxDepthChange,
  displayedDepth,
  setPan,
  handleChartHomeView,
  setToast,
  setRootDisplayNames,
  scheduleCenterOnPerson,
  effectiveRootId,
  triggerBlinkBack,
  skipNextGoToInitialViewRef,
  openPanToPartnerModal,
  setPedigreeFamcPicker,
  loadFamiliesAsChild,
  togglePedigreeRootSiblings,
  togglePedigreeRootChildren,
  isFanDisplayFamily,
  fanPeek,
  setFanPeek,
  setPersonDetailOverlay,
  setGoToPersonDrawerOpen,
  centerOnPosition,
  centerOnPerson,
  pedigreeFamcPicker,
}: UseFamilyTreeInteractionsInputParams): UseFamilyTreeInteractionsParams {
  return {
    familyTreeActionsParams: {
      chartStrategyName: chartStrategy,
      dispatch,
      viewState,
      settings,
      panels,
      search,
      spouseDrawer,
      currentDepthRendered,
      atMaxDepth,
      effectiveMaxDepth,
      handleMaxDepthChange,
      displayedDepth,
      setPan,
      goToInitialView: handleChartHomeView,
      setToast,
      setRootDisplayNames,
      scheduleCenterOnPerson,
      effectiveRootId,
      triggerBlinkBack,
      skipNextGoToInitialViewRef,
      openPanToPartnerModal,
      setPedigreeFamcPicker,
      loadFamiliesAsChild,
      togglePedigreeRootSiblings,
      togglePedigreeRootChildren,
    },
    chartSurfaceParams: {
      isFanDisplayFamily,
      fanPeek,
      setFanPeek,
      setPersonDetailOverlay,
      setRootDisplayNames,
      dispatch,
      setPan,
      triggerBlinkBack,
    },
    overlayParams: {
      fanPeek,
      effectiveRootId,
      setFanPeek,
      setPersonDetailOverlay,
    },
    toggleAllSpousesParams: {
      chartStrategy,
      revealedUnions: viewState.revealedUnions,
      dispatch,
    },
    goToPersonSelectionParams: {
      centerOnPosition,
      centerOnPerson,
      setGoToPersonDrawerOpen,
    },
    overlayCloseHandlersParams: {
      closeSpouseDrawer: spouseDrawer.closeDrawer,
      setGoToPersonDrawerOpen,
    },
    uiCallbacksParams: {
      panels,
      setToast,
    },
    pedigreeFamcPickerActionsParams: {
      effectiveRootId,
      pedigreeFamcPicker,
      setPedigreeFamcPicker,
      dispatch,
    },
  };
}
