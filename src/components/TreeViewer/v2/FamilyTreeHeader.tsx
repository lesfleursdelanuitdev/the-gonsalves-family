"use client";

import type { ViewState, HistoryEntry } from "@/genealogy-visualization-engine";
import type { DescendancyPerson } from "@/genealogy-visualization-engine";
import { ChartHeader } from "./ChartHeader";
import { ChartMenu } from "./ChartHeader";
import type { ChartMenuRootActionDeps } from "./ChartHeader";

export interface FamilyTreeHeaderProps {
  headerOpen: boolean;
  onToggleHeader: () => void;
  /** When true (e.g. Go To Person drawer open), menu z-index is lowered so the drawer backdrop dims it. */
  overlayOpen?: boolean;
  isMobile: boolean;
  rootId: string;
  rootDisplayName: string | null;
  viewState: ViewState;
  showLegendPanel: boolean;
  onToggleLegendPanel: () => void;
  searchGivenName: string;
  searchLastName: string;
  onSearchGivenNameChange: (v: string) => void;
  onSearchLastNameChange: (v: string) => void;
  searchResults: DescendancyPerson[];
  searchLoading?: boolean;
  selectedRootId?: string;
  rootActionDeps: ChartMenuRootActionDeps;
  setShowSearchPanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  mobileSearchHref?: string;
  showHistoryPanel: boolean;
  onHistoryClick: () => void;
  history: HistoryEntry[];
  historyIndex: number;
  onNavigateHistory: (index: number) => void;
  showInfo: boolean;
  onInfoClick: () => void;
  showSettings: boolean;
  onSettingsClick: () => void;
  onGoToPerson?: () => void;
  onToggleAllSpouses?: () => void;
}

export function FamilyTreeHeader({
  headerOpen,
  onToggleHeader,
  overlayOpen = false,
  isMobile,
  rootId,
  rootDisplayName,
  viewState,
  showLegendPanel,
  onToggleLegendPanel,
  searchGivenName,
  searchLastName,
  onSearchGivenNameChange,
  onSearchLastNameChange,
  searchResults,
  searchLoading,
  selectedRootId,
  rootActionDeps,
  setShowSearchPanel,
  mobileSearchHref,
  showHistoryPanel,
  onHistoryClick,
  history,
  historyIndex,
  onNavigateHistory,
  showInfo,
  onInfoClick,
  showSettings,
  onSettingsClick,
  onGoToPerson,
  onToggleAllSpouses,
}: FamilyTreeHeaderProps) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div
        style={{
          overflow: "hidden",
          maxHeight: headerOpen ? 120 : 0,
          transition: "max-height 0.25s ease-out",
        }}
      >
        <ChartHeader
          isMobile={isMobile}
          rootId={rootId}
          rootDisplayName={rootDisplayName}
          viewState={viewState}
          showLegendPanel={showLegendPanel}
          onToggleLegendPanel={onToggleLegendPanel}
          history={history}
          historyIndex={historyIndex}
          onNavigateHistory={onNavigateHistory}
        />
      </div>
      <ChartMenu
        headerOpen={headerOpen}
        onToggleHeader={onToggleHeader}
        overlayOpen={overlayOpen}
        isMobile={isMobile}
        rootDisplayName={rootDisplayName}
        searchGivenName={searchGivenName}
        searchLastName={searchLastName}
        onSearchGivenNameChange={onSearchGivenNameChange}
        onSearchLastNameChange={onSearchLastNameChange}
        searchResults={searchResults}
        searchLoading={searchLoading}
        selectedRootId={selectedRootId}
        rootActionDeps={rootActionDeps}
        setShowSearchPanel={setShowSearchPanel}
        mobileSearchHref={mobileSearchHref}
        showHistoryPanel={showHistoryPanel}
        onHistoryClick={onHistoryClick}
        showInfo={showInfo}
        onInfoClick={onInfoClick}
        showSettings={showSettings}
        onSettingsClick={onSettingsClick}
        onGoToPerson={onGoToPerson}
        onToggleAllSpouses={onToggleAllSpouses}
      />
    </div>
  );
}
