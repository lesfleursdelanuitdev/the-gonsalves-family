"use client";

import { useCallback } from "react";
import type { ChartViewStrategyName, HistoryEntry } from "@/genealogy-visualization-engine";
import { MenuDivider } from "./ChartHeader/MenuDivider";
import {
  ChartMenuBackButton,
  ChartMenuForwardButton,
  ChartMenuHomeButton,
  ChartMenuGoToPersonButton,
  ChartMenuToggleAllSpousesButton,
} from "./ChartHeader/ChartMenu/ChartMenuButtons";
import type { ChartMenuRootActionDeps } from "./ChartHeader";

export interface FamilyTreeEmbedToolbarProps {
  history: HistoryEntry[];
  historyIndex: number;
  onNavigateHistory: (index: number) => void;
  rootActionDeps: ChartMenuRootActionDeps;
  onGoToPerson?: () => void;
  onToggleAllSpouses?: () => void;
  chartStrategy: ChartViewStrategyName;
  showHistoryPanel: boolean;
  onHistoryClick: () => void;
  isMobile: boolean;
}

export function FamilyTreeEmbedToolbar({
  history,
  historyIndex,
  onNavigateHistory,
  rootActionDeps,
  onGoToPerson,
  onToggleAllSpouses,
  chartStrategy,
  isMobile,
}: FamilyTreeEmbedToolbarProps) {
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  const showLabel = !isMobile;

  const goHome = useCallback(() => {
    rootActionDeps.clearSearchAndClosePanel();
    rootActionDeps.onGoToInitialView();
    rootActionDeps.triggerBlinkBack();
  }, [rootActionDeps]);

  const isDescendancy = chartStrategy === "descendancy";

  return (
    <div
      style={{
        paddingLeft: 12,
        paddingRight: 12,
        minHeight: 44,
        height: 44,
        borderBottom: "1px solid var(--tree-border)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "#f4efe2",
        flexShrink: 0,
        fontSize: 12,
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
      <MenuDivider />
      <ChartMenuHomeButton onClick={goHome} showLabel={showLabel} />
      {onGoToPerson && (
        <>
          <MenuDivider />
          <ChartMenuGoToPersonButton onClick={onGoToPerson} showLabel={showLabel} />
        </>
      )}
      {isDescendancy && onToggleAllSpouses && (
        <>
          <MenuDivider />
          <ChartMenuToggleAllSpousesButton onClick={onToggleAllSpouses} showLabel={showLabel} />
        </>
      )}
    </div>
  );
}
