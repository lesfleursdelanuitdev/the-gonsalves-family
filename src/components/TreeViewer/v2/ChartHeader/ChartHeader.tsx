"use client";

import { getPeople } from "@/genealogy-visualization-engine";
import type { ViewState, HistoryEntry } from "@/genealogy-visualization-engine";
import { ChartHeaderTitle } from "./ChartHeaderTitle";
import { ChartHeaderSiblingLegendButton } from "./ChartHeaderSiblingLegendButton";
import { ChartHeaderInfo } from "./ChartHeaderInfo";
import { ChartMenuBackButton, ChartMenuForwardButton } from "./ChartMenu/ChartMenuButtons";

interface ChartHeaderProps {
  isMobile?: boolean;
  rootId: string;
  rootDisplayName?: string | null;
  viewState: ViewState;
  showLegendPanel: boolean;
  onToggleLegendPanel: () => void;
  history: HistoryEntry[];
  historyIndex: number;
  onNavigateHistory: (index: number) => void;
}

export function ChartHeader({
  isMobile = false,
  rootId,
  rootDisplayName,
  viewState,
  showLegendPanel,
  onToggleLegendPanel,
  history,
  historyIndex,
  onNavigateHistory,
}: ChartHeaderProps) {
  const rootPerson = getPeople().get(rootId);
  const displayName =
    rootDisplayName ?? (rootPerson ? `${rootPerson.firstName} ${rootPerson.lastName}`.trim() : null);
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  return (
    <div
      style={{
        padding: isMobile ? "10px 12px" : "16px 28px",
        borderBottom: "1px solid var(--tree-border-subtle)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "#f4efe2",
      }}
    >
      {!isMobile && (
        <div
          style={{
            width: 3,
            height: 24,
            background: "var(--tree-root)",
            borderRadius: 2,
          }}
        />
      )}
      <ChartHeaderTitle displayName={displayName} isMobile={isMobile} />
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <ChartMenuBackButton
          onClick={() => onNavigateHistory(historyIndex - 1)}
          disabled={!canGoBack}
          showLabel={false}
        />
        <ChartMenuForwardButton
          onClick={() => onNavigateHistory(historyIndex + 1)}
          disabled={!canGoForward}
          showLabel={false}
        />
        {viewState.siblingView && (
          <ChartHeaderSiblingLegendButton
            showLegendPanel={showLegendPanel}
            onToggleLegendPanel={onToggleLegendPanel}
          />
        )}
        <ChartHeaderInfo isMobile={isMobile} />
      </div>
    </div>
  );
}
