"use client";

import type { DescendancyPerson } from "@/genealogy-visualization-engine";
import type { TreeAction } from "@/genealogy-visualization-engine";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { useCallback } from "react";
import { DatabaseSearchbox } from "../DatabaseSearchbox/DatabaseSearchbox";
import { getChartMenuItems } from "./ChartMenuItems";
import { MenuDivider } from "../MenuDivider";
import { ChartTypeModal } from "./ChartTypeModal";
import { ChartMenuChartButton } from "./ChartMenuButtons/ChartMenuChartButton";
import { ChartMenuMore } from "./ChartMenuMore";

export interface ChartMenuRootActionDeps {
  dispatch: (action: TreeAction) => void;
  setRootDisplayNames: (
    value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void;
  onCloseDrawer: () => void;
  setPan: (pan: { x: number; y: number }) => void;
  triggerBlinkBack: () => void;
  onGoToInitialView: () => void;
  clearSearchAndClosePanel: () => void;
}

export interface ChartMenuProps {
  headerOpen: boolean;
  onToggleHeader: () => void;
  /** When true, z-index is lowered so a drawer backdrop dims the menu (avoids menu "lighting up" over overlay). */
  overlayOpen?: boolean;
  isMobile: boolean;
  rootDisplayName?: string | null;
  chartStrategy: ChartViewStrategyName;
  onChartStrategyChange: (next: ChartViewStrategyName) => void | Promise<void>;
  searchGivenName: string;
  searchLastName: string;
  onSearchGivenNameChange: (v: string) => void;
  onSearchLastNameChange: (v: string) => void;
  searchResults: DescendancyPerson[];
  searchLoading?: boolean;
  selectedRootId?: string;
  rootActionDeps: ChartMenuRootActionDeps;
  setShowSearchPanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  /** When set and isMobile, search control is a link to this URL (e.g. /search). No mobile panel in v2. */
  mobileSearchHref?: string;
  showHistoryPanel: boolean;
  onHistoryClick: () => void;
  showInfo: boolean;
  onInfoClick?: () => void;
  showSettings: boolean;
  onSettingsClick?: () => void;
  onGoToPerson?: () => void;
  onToggleAllSpouses?: () => void;
  chartTypeModalOpen: boolean;
  onChartTypeModalOpenChange: (open: boolean) => void;
  onOpenTutorial?: () => void;
}

export function ChartMenu({
  headerOpen,
  onToggleHeader,
  overlayOpen = false,
  isMobile,
  rootDisplayName,
  chartStrategy,
  onChartStrategyChange,
  searchGivenName,
  searchLastName,
  onSearchGivenNameChange,
  onSearchLastNameChange,
  searchResults,
  searchLoading = false,
  selectedRootId,
  rootActionDeps,
  setShowSearchPanel,
  mobileSearchHref,
  showHistoryPanel,
  onHistoryClick,
  showInfo,
  onInfoClick,
  showSettings,
  onSettingsClick,
  onGoToPerson,
  onToggleAllSpouses,
  chartTypeModalOpen,
  onChartTypeModalOpenChange,
  onOpenTutorial,
}: ChartMenuProps) {
  const selectSearchResult = useCallback(
    (person: DescendancyPerson) => {
      rootActionDeps.clearSearchAndClosePanel();
      const name = `${person.firstName} ${person.lastName}`.trim();
      rootActionDeps.setRootDisplayNames((prev) => ({ ...prev, [person.id]: name }));
      rootActionDeps.dispatch({ type: "ROOT", personId: person.id });
      rootActionDeps.onCloseDrawer();
      rootActionDeps.setPan({ x: 0, y: 0 });
      rootActionDeps.triggerBlinkBack();
    },
    [rootActionDeps]
  );

  const goHome = useCallback(() => {
    const { onGoToInitialView, triggerBlinkBack, clearSearchAndClosePanel } = rootActionDeps;
    clearSearchAndClosePanel();
    onGoToInitialView();
    triggerBlinkBack();
  }, [rootActionDeps]);

  const showLabel = true;
  const menuItems = getChartMenuItems({
    isMobile,
    showLabel,
    onHistoryClick,
    showHistoryPanel,
    goHome,
    onGoToPerson,
    headerOpen,
    onToggleHeader,
  });

  const chartButton = (
    <ChartMenuChartButton
      onClick={() => onChartTypeModalOpenChange(true)}
      active={chartTypeModalOpen}
      showLabel={showLabel}
    />
  );

  const chartTypeModal = (
    <ChartTypeModal
      open={chartTypeModalOpen}
      value={chartStrategy}
      isMobile={isMobile}
      onClose={() => onChartTypeModalOpenChange(false)}
      onSelect={(next) => {
        onChartStrategyChange(next);
      }}
    />
  );

  const menuItemNodes = menuItems
    .filter((item) => item.show)
    .map((item) => (
      <span key={item.key} style={{ display: "contents" }}>
        <MenuDivider />
        {item.node}
      </span>
    ));

  const moreBlock = (
    <ChartMenuMore
      isMobile={isMobile}
      mobileSearchHref={isMobile ? mobileSearchHref : undefined}
      mobileOnGoHome={isMobile ? goHome : undefined}
      mobileOnToggleAllSpouses={isMobile ? onToggleAllSpouses : undefined}
      showInfo={showInfo}
      onInfoClick={onInfoClick}
      showSettings={showSettings}
      onSettingsClick={onSettingsClick}
      onOpenTutorial={onOpenTutorial}
    />
  );

  return (
    <div
      style={{
        paddingTop: isMobile ? 6 : 0,
        paddingBottom: isMobile ? 6 : 0,
        paddingLeft: 12,
        paddingRight: 12,
        minHeight: 44,
        height: isMobile ? "auto" : 44,
        borderBottom: "1px solid var(--tree-border)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "#f4efe2",
        flexShrink: 0,
        fontSize: isMobile ? 10 : 12,
        position: "sticky",
        top: 0,
        zIndex: overlayOpen ? 50 : 100,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
      }}
    >
      {!isMobile ? (
        <>
          <DatabaseSearchbox
            searchGivenName={searchGivenName}
            searchLastName={searchLastName}
            onSearchGivenNameChange={onSearchGivenNameChange}
            onSearchLastNameChange={onSearchLastNameChange}
            searchResults={searchResults}
            searchLoading={searchLoading}
            selectedRootId={selectedRootId}
            onSelectResult={selectSearchResult}
            setShowSearchPanel={setShowSearchPanel}
          />
          <MenuDivider />
        </>
      ) : null}

      {isMobile ? (
        <>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexWrap: "nowrap",
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
            }}
          >
            {chartButton}
            {chartTypeModal}
            {menuItemNodes}
          </div>
          <MenuDivider />
          <div style={{ flexShrink: 0 }}>{moreBlock}</div>
        </>
      ) : (
        <>
          {chartButton}
          {chartTypeModal}
          {menuItemNodes}
          <MenuDivider />
          {moreBlock}
        </>
      )}
    </div>
  );
}
