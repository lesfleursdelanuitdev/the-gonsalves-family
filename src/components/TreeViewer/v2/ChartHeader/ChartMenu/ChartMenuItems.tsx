"use client";

import type { ReactNode } from "react";
import {
  ChartMenuGoToPersonButton,
  ChartMenuHeaderToggleButton,
  ChartMenuHistoryButton,
  ChartMenuHomeButton,
  ChartMenuInfoButton,
  ChartMenuSettingsButton,
  ChartMenuToggleAllSpousesButton,
} from "./ChartMenuButtons";

export interface ChartMenuItemsParams {
  isMobile: boolean;
  showLabel: boolean;
  onHistoryClick: () => void;
  showHistoryPanel: boolean;
  goHome: () => void;
  onInfoClick: () => void;
  showInfo: boolean;
  onSettingsClick: () => void;
  showSettings: boolean;
  onGoToPerson?: () => void;
  onToggleAllSpouses?: () => void;
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
    onInfoClick,
    showInfo,
    onSettingsClick,
    showSettings,
    onGoToPerson,
    onToggleAllSpouses,
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
    { key: "home", show: true, node: <ChartMenuHomeButton onClick={goHome} showLabel={showLabel} /> },
    {
      key: "info",
      show: true,
      node: (
        <ChartMenuInfoButton onClick={onInfoClick} active={showInfo} showLabel={showLabel} />
      ),
    },
    {
      key: "settings",
      show: true,
      node: (
        <ChartMenuSettingsButton
          onClick={onSettingsClick}
          active={showSettings}
          showLabel={showLabel}
        />
      ),
    },
    {
      key: "goToPerson",
      show: isMobile && onGoToPerson != null,
      node: onGoToPerson ? <ChartMenuGoToPersonButton onClick={onGoToPerson} /> : null,
    },
    {
      key: "toggleAllSpouses",
      show: isMobile && onToggleAllSpouses != null,
      node:
        onToggleAllSpouses != null ? (
          <ChartMenuToggleAllSpousesButton onClick={onToggleAllSpouses} />
        ) : null,
    },
    {
      key: "headerToggle",
      show: !isMobile,
      node: (
        <ChartMenuHeaderToggleButton headerOpen={headerOpen} onToggle={onToggleHeader} />
      ),
    },
  ];
}
