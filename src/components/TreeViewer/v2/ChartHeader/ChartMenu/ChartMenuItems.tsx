"use client";

import type { ReactNode } from "react";
import {
  ChartMenuGoToPersonButton,
  ChartMenuHeaderToggleButton,
  ChartMenuHistoryButton,
  ChartMenuHomeButton,
} from "./ChartMenuButtons";

export interface ChartMenuItemsParams {
  isMobile: boolean;
  showLabel: boolean;
  onHistoryClick: () => void;
  showHistoryPanel: boolean;
  goHome: () => void;
  onGoToPerson?: () => void;
  headerOpen: boolean;
  onToggleHeader: () => void;
}

export interface ChartMenuItem {
  key: string;
  show: boolean;
  node: ReactNode;
}

export function getChartMenuItems(params: ChartMenuItemsParams): ChartMenuItem[] {
  const {
    isMobile,
    showLabel,
    onHistoryClick,
    showHistoryPanel,
    goHome,
    onGoToPerson,
    headerOpen,
    onToggleHeader,
  } = params;

  return [
    {
      key: "history",
      show: true,
      node: (
        <ChartMenuHistoryButton
          onClick={onHistoryClick}
          active={showHistoryPanel}
          showLabel={showLabel}
        />
      ),
    },
    {
      key: "home",
      show: !isMobile,
      node: <ChartMenuHomeButton onClick={goHome} showLabel={showLabel} />,
    },
    {
      key: "goToPerson",
      show: isMobile && onGoToPerson != null,
      node: onGoToPerson ? (
        <ChartMenuGoToPersonButton onClick={onGoToPerson} showLabel={showLabel} />
      ) : null,
    },
    {
      key: "headerToggle",
      show: !isMobile,
      node: (
        <ChartMenuHeaderToggleButton
          headerOpen={headerOpen}
          onToggle={onToggleHeader}
          showLabel={showLabel}
        />
      ),
    },
  ];
}
