"use client";

import { useMemo } from "react";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import type { FamilyTreeHeaderProps } from "../FamilyTreeHeader";
import type { UseFamilyTreeRenderPropsParams } from "./useFamilyTreeRenderProps";
import type { ChartMenuRootActionDeps } from "../ChartHeader";

export interface UseFamilyTreeRenderPropsInputParams {
  headerOpen: boolean;
  setHeaderOpen: React.Dispatch<React.SetStateAction<boolean>>;
  goToPersonDrawerOpen: boolean;
  isMobile: boolean;
  rootId: string;
  rootDisplayName: string | null;
  chartStrategy: ChartViewStrategyName;
  handleChartStrategyChange: FamilyTreeHeaderProps["onChartStrategyChange"];
  chartTypeModalOpen: boolean;
  setChartTypeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowTutorialModal: React.Dispatch<React.SetStateAction<boolean>>;
  viewState: UseFamilyTreeRenderPropsParams["overlays"]["viewState"];
  panels: {
    showLegendPanel: boolean;
    toggleHistoryPanel: () => void;
    showHistoryPanel: boolean;
    toggleInfoPanel: () => void;
    showInfo: boolean;
    toggleSettingsPanel: () => void;
    showSettings: boolean;
    showDebugPanel: boolean;
    showLegendModal: boolean;
  };
  search: {
    searchGivenName: string;
    searchLastName: string;
    setSearchGivenName: (name: string) => void;
    setSearchLastName: (name: string) => void;
    searchResults: FamilyTreeHeaderProps["searchResults"];
    searchLoading: boolean;
  };
  actions: {
    rootActionDeps: unknown;
    setShowSearchPanel: (v: boolean | ((prev: boolean) => boolean) ) => void;
    onAction: UseFamilyTreeRenderPropsParams["viewport"]["onAction"];
    onDrawerSelect: UseFamilyTreeRenderPropsParams["overlays"]["onSpouseDrawerSelect"];
    onDrawerSelectAll: UseFamilyTreeRenderPropsParams["overlays"]["onSpouseDrawerSelectAll"];
    onCloseSpouse: UseFamilyTreeRenderPropsParams["overlays"]["onSpouseDrawerCloseSpouse"];
    onCloseAllSpouses: UseFamilyTreeRenderPropsParams["overlays"]["onSpouseDrawerCloseAll"];
    onDrawerSetFamilyUnitScope: UseFamilyTreeRenderPropsParams["overlays"]["onSpouseDrawerSetFamilyUnitScope"];
  };
  state: UseFamilyTreeRenderPropsParams["overlays"]["state"];
  historyHandlers: {
    onNavigateHistory: (index: number) => void;
    onClearHistory: () => void;
  };
  onToggleAllSpouses: (() => void) | undefined;
  setGoToPersonDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isChartLoading: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  baseX: number;
  baseY: number;
  pan: { x: number; y: number };
  scale: number;
  root: UseFamilyTreeRenderPropsParams["viewport"]["root"];
  effectiveRootId: string;
  chartSurfaceInteractions: {
    onNameClick: UseFamilyTreeRenderPropsParams["viewport"]["onNameClick"];
    onFanMoreClick: UseFamilyTreeRenderPropsParams["viewport"]["onFanMoreClick"];
  };
  settings: UseFamilyTreeRenderPropsParams["viewport"]["settings"];
  chartAdapter: UseFamilyTreeRenderPropsParams["viewport"]["chartAdapter"];
  effectivePersonHeight: number;
  dragging: boolean;
  onPointerDown: UseFamilyTreeRenderPropsParams["viewport"]["onPointerDown"];
  onPointerMove: UseFamilyTreeRenderPropsParams["viewport"]["onPointerMove"];
  onPointerUp: UseFamilyTreeRenderPropsParams["viewport"]["onPointerUp"];
  onWheel: UseFamilyTreeRenderPropsParams["viewport"]["onWheel"];
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  bounds: UseFamilyTreeRenderPropsParams["viewport"]["bounds"];
  setPan: UseFamilyTreeRenderPropsParams["viewport"]["setPan"];
  pedigreeHasRoomToExpandDepth: boolean;
  isAncestorChart: boolean;
  pedigreeMultiFamilyChildXrefs: string[] | null;
  pedigreeRootSiblingsForViewport: UseFamilyTreeRenderPropsParams["viewport"]["pedigreeRootSiblings"];
  pedigreeRootChildrenForViewport: UseFamilyTreeRenderPropsParams["viewport"]["pedigreeRootChildren"];
  toast: UseFamilyTreeRenderPropsParams["overlays"]["toast"];
  uiCallbacks: {
    dismissToast: () => void;
    closeDebugPanel: () => void;
    closeHistoryPanel: () => void;
    closeInfoPanel: () => void;
    closeSettingsPanel: () => void;
    closeLegendPanel: () => void;
    closeLegendModal: () => void;
    toggleLegendPanel: () => void;
    toggleDebugPanel: () => void;
  };
  effectiveMaxDepth: number;
  updateSetting: UseFamilyTreeRenderPropsParams["overlays"]["onUpdateSetting"];
  displayedDepth: number;
  handleMaxDepthChange: (n: number) => void;
  overlayCloseHandlers: {
    onCloseSpouseDrawer: () => void;
    onCloseGoToPersonDrawer: () => void;
  };
  spouseDrawerPersonId: string | null;
  treePeople: UseFamilyTreeRenderPropsParams["overlays"]["treePeople"];
  handleSelectPerson: UseFamilyTreeRenderPropsParams["overlays"]["onSelectPerson"];
  showPanToPartnerModal: boolean;
  onConfirmPanToPartner: () => void;
  onClosePanToPartnerModal: () => void;
  showTutorialModal: boolean;
  handleCloseTutorial: () => void;
}

export function useFamilyTreeRenderPropsInput(
  params: UseFamilyTreeRenderPropsInputParams
): UseFamilyTreeRenderPropsParams {
  return useMemo(
    () => ({
      header: {
        headerOpen: params.headerOpen,
        onToggleHeader: () => params.setHeaderOpen((v) => !v),
        overlayOpen:
          params.goToPersonDrawerOpen ||
          (params.isMobile && params.panels.showHistoryPanel),
        isMobile: params.isMobile,
        rootId: params.rootId,
        rootDisplayName: params.rootDisplayName,
        chartStrategy: params.chartStrategy,
        onChartStrategyChange: params.handleChartStrategyChange,
        chartTypeModalOpen: params.chartTypeModalOpen,
        onChartTypeModalOpenChange: params.setChartTypeModalOpen,
        onOpenTutorial: () => params.setShowTutorialModal(true),
        viewState: params.viewState,
        showLegendPanel: params.panels.showLegendPanel,
        onToggleLegendPanel: params.uiCallbacks.toggleLegendPanel,
        searchGivenName: params.search.searchGivenName,
        searchLastName: params.search.searchLastName,
        onSearchGivenNameChange: params.search.setSearchGivenName,
        onSearchLastNameChange: params.search.setSearchLastName,
        searchResults: params.search.searchResults,
        searchLoading: params.search.searchLoading,
        selectedRootId: params.rootId,
        rootActionDeps: params.actions.rootActionDeps as ChartMenuRootActionDeps,
        setShowSearchPanel: params.actions.setShowSearchPanel,
        mobileSearchHref: "/tree/viewer/searchDatabase",
        showHistoryPanel: params.panels.showHistoryPanel,
        onHistoryClick: params.panels.toggleHistoryPanel,
        history: params.state.history,
        historyIndex: params.state.historyIndex,
        onNavigateHistory: params.historyHandlers.onNavigateHistory,
        showInfo: params.panels.showInfo,
        onInfoClick: params.panels.toggleInfoPanel,
        showSettings: params.panels.showSettings,
        onSettingsClick: params.panels.toggleSettingsPanel,
        onGoToPerson: () => params.setGoToPersonDrawerOpen(true),
        onToggleAllSpouses: params.onToggleAllSpouses,
      },
      viewport: {
        isLoading: params.isChartLoading,
        svgRef: params.svgRef,
        baseX: params.baseX,
        baseY: params.baseY,
        pan: params.pan,
        scale: params.scale,
        root: params.root,
        rootId: params.effectiveRootId,
        onAction: params.actions.onAction,
        onNameClick: params.chartSurfaceInteractions.onNameClick,
        onFanMoreClick: params.chartSurfaceInteractions.onFanMoreClick,
        settings: params.settings,
        viewState: params.viewState,
        chartStrategy: params.chartStrategy,
        chartAdapter: params.chartAdapter,
        effectivePersonHeight: params.effectivePersonHeight,
        dragging: params.dragging,
        onPointerDown: params.onPointerDown,
        onPointerMove: params.onPointerMove,
        onPointerUp: params.onPointerUp,
        onWheel: params.onWheel,
        onZoomIn: params.zoomIn,
        onZoomOut: params.zoomOut,
        onFitToScreen: params.fitToScreen,
        onGoToPerson: () => params.setGoToPersonDrawerOpen(true),
        onToggleAllSpouses: params.onToggleAllSpouses,
        bounds: params.bounds,
        setPan: params.setPan,
        isMobile: params.isMobile,
        hasSiblingView: !!params.viewState.siblingView,
        showLegendPanel: params.panels.showLegendPanel,
        onToggleLegendPanel: params.uiCallbacks.toggleLegendPanel,
        showDebugPanel: params.panels.showDebugPanel,
        onToggleDebugPanel: params.uiCallbacks.toggleDebugPanel,
        pedigreeHasRoomToExpandDepth: params.pedigreeHasRoomToExpandDepth,
        pedigreeMultiFamilyChildXrefs: params.isAncestorChart
          ? params.pedigreeMultiFamilyChildXrefs
          : null,
        pedigreeRootSiblings: params.pedigreeRootSiblingsForViewport,
        pedigreeRootChildren: params.pedigreeRootChildrenForViewport,
      },
      overlays: {
        toast: params.toast,
        onDismissToast: params.uiCallbacks.dismissToast,
        showDebugPanel: params.panels.showDebugPanel,
        onCloseDebugPanel: params.uiCallbacks.closeDebugPanel,
        state: params.state,
        showHistoryPanel: params.panels.showHistoryPanel,
        onCloseHistoryPanel: params.uiCallbacks.closeHistoryPanel,
        history: params.state.history,
        historyIndex: params.state.historyIndex,
        onNavigateHistory: params.historyHandlers.onNavigateHistory,
        onClearHistory: params.historyHandlers.onClearHistory,
        showInfo: params.panels.showInfo,
        onCloseInfo: params.uiCallbacks.closeInfoPanel,
        root: params.root,
        rootDisplayName: params.rootDisplayName,
        effectiveMaxDepth: params.effectiveMaxDepth,
        showSettings: params.panels.showSettings,
        onCloseSettings: params.uiCallbacks.closeSettingsPanel,
        settings: params.settings,
        onUpdateSetting: params.updateSetting,
        displayedDepth: params.displayedDepth,
        onMaxDepthChange: params.handleMaxDepthChange,
        chartStrategy: params.chartStrategy,
        viewState: params.viewState,
        effectiveRootId: params.effectiveRootId,
        showLegendPanel: params.panels.showLegendPanel,
        onCloseLegendPanel: params.uiCallbacks.closeLegendPanel,
        showLegendModal: params.panels.showLegendModal,
        onCloseLegendModal: params.uiCallbacks.closeLegendModal,
        isMobile: params.isMobile,
        spouseDrawerPersonId: params.spouseDrawerPersonId,
        onSpouseDrawerSelect: params.actions.onDrawerSelect,
        onSpouseDrawerSelectAll: params.actions.onDrawerSelectAll,
        onSpouseDrawerCloseSpouse: params.actions.onCloseSpouse,
        onSpouseDrawerCloseAll: params.actions.onCloseAllSpouses,
        onSpouseDrawerSetFamilyUnitScope: params.actions.onDrawerSetFamilyUnitScope,
        onCloseSpouseDrawer: params.overlayCloseHandlers.onCloseSpouseDrawer,
        goToPersonDrawerOpen: params.goToPersonDrawerOpen,
        onCloseGoToPersonDrawer: params.overlayCloseHandlers.onCloseGoToPersonDrawer,
        treePeople: params.treePeople,
        effectiveRootIdForDrawer: params.effectiveRootId,
        onSelectPerson: params.handleSelectPerson,
        showPanToPartnerModal: params.showPanToPartnerModal,
        onConfirmPanToPartner: params.onConfirmPanToPartner,
        onClosePanToPartnerModal: params.onClosePanToPartnerModal,
        showTutorialModal: params.showTutorialModal,
        onCloseTutorial: params.handleCloseTutorial,
      },
    }),
    [params]
  );
}
