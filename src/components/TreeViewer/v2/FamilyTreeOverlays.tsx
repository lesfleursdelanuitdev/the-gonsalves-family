"use client";

import { useMemo } from "react";
import { getPeople, getUnions, buildLegendItems, countVisibleNodes } from "@/genealogy-visualization-engine";
import type { ViewState } from "@/genealogy-visualization-engine";
import type { HistoryEntry } from "@/genealogy-visualization-engine";
import type { ChartNode } from "@/genealogy-visualization-engine";
import type { TreeState } from "@/genealogy-visualization-engine";
import { ToastMessage } from "./ToastMessage";
import { DebugPanel } from "./ChartPanels/DebugPanel";
import { HistoryPanel } from "./ChartPanels/HistoryPanel";
import { InfoPanel } from "./ChartPanels/InfoPanel";
import { SettingsPanel } from "./ChartPanels/SettingsPanel";
import { LegendPanel } from "./ChartPanels/LegendPanel";
import { LegendModal } from "./ChartHeader/LegendModal";
import { PanToPartnerModal } from "./ChartHeader/PanToPartnerModal";
import { TutorialModal } from "./ChartHeader/TutorialModal";
import { SpouseDrawer } from "./ChartDrawers";
import { GoToPersonDrawer } from "./ChartDrawers";
import type { ChartSettingsV2 } from "./ChartPanels/SettingsPanel";
import type { GoToPersonItem } from "./hooks/useTreePeople";

export interface FamilyTreeOverlaysProps {
  toast: { title: string; parts: { pedi: string; names: string }[] } | null;
  onDismissToast: () => void;
  showDebugPanel: boolean;
  onCloseDebugPanel: () => void;
  state: TreeState;
  showHistoryPanel: boolean;
  onCloseHistoryPanel: () => void;
  history: HistoryEntry[];
  historyIndex: number;
  onNavigateHistory: (index: number) => void;
  onClearHistory: () => void;
  showInfo: boolean;
  onCloseInfo: () => void;
  root: ChartNode;
  rootDisplayName: string | null;
  effectiveMaxDepth: number;
  showSettings: boolean;
  onCloseSettings: () => void;
  settings: ChartSettingsV2;
  onUpdateSetting: <K extends keyof ChartSettingsV2>(
    key: K,
    value: ChartSettingsV2[K]
  ) => void;
  displayedDepth: number;
  onMaxDepthChange: (n: number) => void;
  viewState: ViewState;
  effectiveRootId: string;
  showLegendPanel: boolean;
  onCloseLegendPanel: () => void;
  showLegendModal: boolean;
  onCloseLegendModal: () => void;
  isMobile: boolean;
  spouseDrawerPersonId: string | null;
  onSpouseDrawerSelect: (personId: string, spouseId: string) => void;
  onSpouseDrawerSelectAll?: (personId: string, spouseIdToPanTo: string) => void;
  onSpouseDrawerCloseSpouse?: (spouseId: string) => void;
  onSpouseDrawerCloseAll?: (personId: string) => void;
  onCloseSpouseDrawer: () => void;
  goToPersonDrawerOpen: boolean;
  onCloseGoToPersonDrawer: () => void;
  treePeople: GoToPersonItem[];
  effectiveRootIdForDrawer: string;
  onSelectPerson: (
    personId: string,
    layoutX?: number,
    layoutY?: number
  ) => void;
  showPanToPartnerModal: boolean;
  onConfirmPanToPartner: () => void;
  onClosePanToPartnerModal: () => void;
  showTutorialModal: boolean;
  onCloseTutorial: () => void;
  strategyName: string;
}

export function FamilyTreeOverlays({
  toast,
  onDismissToast,
  showDebugPanel,
  onCloseDebugPanel,
  state,
  showHistoryPanel,
  onCloseHistoryPanel,
  history,
  historyIndex,
  onNavigateHistory,
  onClearHistory,
  showInfo,
  onCloseInfo,
  root,
  rootDisplayName,
  effectiveMaxDepth,
  showSettings,
  onCloseSettings,
  settings,
  onUpdateSetting,
  displayedDepth,
  onMaxDepthChange,
  viewState,
  effectiveRootId,
  showLegendPanel,
  onCloseLegendPanel,
  showLegendModal,
  onCloseLegendModal,
  isMobile,
  spouseDrawerPersonId,
  onSpouseDrawerSelect,
  onSpouseDrawerSelectAll,
  onSpouseDrawerCloseSpouse,
  onSpouseDrawerCloseAll,
  onCloseSpouseDrawer,
  goToPersonDrawerOpen,
  onCloseGoToPersonDrawer,
  treePeople,
  effectiveRootIdForDrawer,
  onSelectPerson,
  showPanToPartnerModal,
  onConfirmPanToPartner,
  onClosePanToPartnerModal,
  showTutorialModal,
  onCloseTutorial,
  strategyName,
}: FamilyTreeOverlaysProps) {
  const legendItems = useMemo(
    () => buildLegendItems(viewState.siblingView, effectiveRootId, viewState),
    [viewState, effectiveRootId]
  );

  // Current depth = depth actually shown (user-selected max capped by rendered depth). Use displayedDepth
  // so panels update when the tree re-renders (e.g. after "Show parents", "Show children") and maxDepthRendered changes.
  const infoStats = useMemo(
    () => ({
      totalPeople: getPeople().size,
      totalUnions: getUnions().length,
      visibleCount: countVisibleNodes(root),
      currentDepth: displayedDepth,
      rootDisplayName,
    }),
    [root, displayedDepth, rootDisplayName]
  );

  return (
    <>
      <ToastMessage toast={toast} onDismiss={onDismissToast} />

      {showDebugPanel && (
        <DebugPanel state={state} onClose={onCloseDebugPanel} />
      )}

      {showHistoryPanel && (
        <HistoryPanel
          history={history}
          historyIndex={historyIndex}
          onNavigate={onNavigateHistory}
          onClearHistory={onClearHistory}
          onClose={onCloseHistoryPanel}
          isMobile={isMobile}
        />
      )}

      {showInfo && (
        <InfoPanel
          stats={infoStats}
          onClose={onCloseInfo}
          isMobile={isMobile}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdateSetting={onUpdateSetting}
          onClose={onCloseSettings}
          isMobile={isMobile}
          maxDepth={effectiveMaxDepth}
          displayedDepth={displayedDepth}
          onMaxDepthChange={onMaxDepthChange}
        />
      )}

      <LegendModal
        open={showLegendModal}
        viewState={viewState}
        effectiveRootId={effectiveRootId}
        onClose={onCloseLegendModal}
      />

      {showLegendPanel && viewState.siblingView && (
        <LegendPanel
          items={legendItems}
          onClose={onCloseLegendPanel}
          maxDepth={effectiveMaxDepth}
        />
      )}

      {spouseDrawerPersonId && (
        <SpouseDrawer
          personId={spouseDrawerPersonId}
          viewState={viewState}
          onSelect={onSpouseDrawerSelect}
          onCloseSpouse={onSpouseDrawerCloseSpouse}
          onSelectAll={onSpouseDrawerSelectAll}
          onCloseAll={onSpouseDrawerCloseAll}
          onClose={onCloseSpouseDrawer}
        />
      )}

      <GoToPersonDrawer
        open={goToPersonDrawerOpen}
        people={treePeople}
        rootId={effectiveRootIdForDrawer}
        onClose={onCloseGoToPersonDrawer}
        onSelectPerson={onSelectPerson}
      />

      <PanToPartnerModal
        open={showPanToPartnerModal}
        onConfirm={onConfirmPanToPartner}
        onClose={onClosePanToPartnerModal}
      />

      <TutorialModal
        open={showTutorialModal}
        onClose={onCloseTutorial}
        isMobile={isMobile}
        strategyName={strategyName}
      />
    </>
  );
}
