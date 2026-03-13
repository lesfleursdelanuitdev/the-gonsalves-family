"use client";

import type { HistoryEntry, ViewState } from "@/descendancy-chart";
import { getPeople, getUnions } from "@/descendancy-chart";
import { HistoryPanel } from "./HistoryPanel";
import { InfoPanel } from "./InfoPanel";
import { SettingsPanel } from "./SettingsPanel";
import type { ChartSettings } from "./SettingsPanel";
import { LegendPanel } from "./LegendPanel";
import { LegendModal } from "../ChartHeader/LegendModal";
import { buildLegendItems, countVisibleNodes } from "@/descendancy-chart";
import type { ChartNode } from "@/descendancy-chart";
import { useMemo } from "react";

export type { ChartSettings } from "./SettingsPanel";
export { DebugPanel } from "./DebugPanel";

export interface ChartPanelsProps {
  // History
  showHistoryPanel: boolean;
  onCloseHistoryPanel: () => void;
  history: HistoryEntry[];
  historyIndex: number;
  onNavigateHistory: (index: number) => void;

  // Info (inputs; stats computed inside)
  showInfo: boolean;
  onCloseInfo: () => void;
  root: ChartNode;
  rootDisplayName: string | null;
  maxDepth: number;

  // Settings
  showSettings: boolean;
  onCloseSettings: () => void;
  settings: ChartSettings;
  onUpdateSetting: <K extends keyof ChartSettings>(
    key: K,
    value: ChartSettings[K]
  ) => void;
  displayedDepth?: number;
  onMaxDepthChange: (n: number) => void;

  // Legend panel & modal
  viewState: ViewState;
  effectiveRootId: string;
  showLegendPanel: boolean;
  onCloseLegendPanel: () => void;
  showLegendModal: boolean;
  onCloseLegendModal: () => void;

  isMobile?: boolean;
}

export function ChartPanels({
  showHistoryPanel,
  onCloseHistoryPanel,
  history,
  historyIndex,
  onNavigateHistory,
  showInfo,
  onCloseInfo,
  root,
  rootDisplayName,
  maxDepth,
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
  isMobile = false,
}: ChartPanelsProps) {
  const anyModalOpen = showHistoryPanel || showInfo || showSettings;
  const legendItems = buildLegendItems(
    viewState.siblingView,
    effectiveRootId,
    viewState
  );

  const infoStats = useMemo(
    () => ({
      totalPeople: getPeople().size,
      totalUnions: getUnions().length,
      visibleCount: countVisibleNodes(root),
      currentDepth: maxDepth,
      rootDisplayName,
    }),
    [root, maxDepth, rootDisplayName]
  );

  const closeModal = () => {
    if (showHistoryPanel) onCloseHistoryPanel();
    if (showInfo) onCloseInfo();
    if (showSettings) onCloseSettings();
  };

  return (
    <>
      {isMobile && anyModalOpen ? (
        <>
          <div
            role="presentation"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 299,
              background: "rgba(0,0,0,0.35)",
            }}
            onClick={closeModal}
            aria-hidden
          />
          <div
            style={{
              position: "fixed",
              inset: 20,
              zIndex: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                pointerEvents: "auto",
                maxWidth: "100%",
                maxHeight: "100%",
                overflow: "auto",
              }}
            >
              {showHistoryPanel && (
                <HistoryPanel
                  history={history}
                  historyIndex={historyIndex}
                  onNavigate={onNavigateHistory}
                  onClose={onCloseHistoryPanel}
                  isMobile
                />
              )}
              {showInfo && <InfoPanel stats={infoStats} onClose={onCloseInfo} isMobile />}
              {showSettings && (
                <SettingsPanel
                  settings={settings}
                  onUpdateSetting={onUpdateSetting}
                  onClose={onCloseSettings}
                  isMobile
                  maxDepth={maxDepth}
                  displayedDepth={displayedDepth}
                  onMaxDepthChange={onMaxDepthChange}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {showHistoryPanel && (
            <HistoryPanel
              history={history}
              historyIndex={historyIndex}
              onNavigate={onNavigateHistory}
              onClose={onCloseHistoryPanel}
            />
          )}

          {showInfo && <InfoPanel stats={infoStats} onClose={onCloseInfo} />}

          {showSettings && (
            <SettingsPanel
              settings={settings}
              onUpdateSetting={onUpdateSetting}
              onClose={onCloseSettings}
              maxDepth={maxDepth}
              displayedDepth={displayedDepth}
              onMaxDepthChange={onMaxDepthChange}
            />
          )}
        </>
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
          maxDepth={maxDepth}
        />
      )}
    </>
  );
}
