"use client";

import type { DescendancyPerson } from "@/genealogy-visualization-engine";
import type { TreeAction } from "@/genealogy-visualization-engine";
import { useCallback } from "react";
import { DatabaseSearchbox } from "../DatabaseSearchbox/DatabaseSearchbox";
import { getChartMenuItems } from "./ChartMenuItems";
import { MenuDivider } from "../MenuDivider";

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
  onInfoClick: () => void;
  showSettings: boolean;
  onSettingsClick: () => void;
  onGoToPerson?: () => void;
  onToggleAllSpouses?: () => void;
}

export function ChartMenu({
  headerOpen,
  onToggleHeader,
  overlayOpen = false,
  isMobile,
  rootDisplayName,
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

  const showLabel = !isMobile;
  const menuItems = getChartMenuItems({
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
  });

  return (
    <div
      style={{
        padding: "0 12px",
        height: 44,
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
      <DatabaseSearchbox
        isMobile={isMobile}
        searchGivenName={searchGivenName}
        searchLastName={searchLastName}
        onSearchGivenNameChange={onSearchGivenNameChange}
        onSearchLastNameChange={onSearchLastNameChange}
        searchResults={searchResults}
        searchLoading={searchLoading}
        selectedRootId={selectedRootId}
        onSelectResult={selectSearchResult}
        setShowSearchPanel={setShowSearchPanel}
        mobileSearchHref={mobileSearchHref}
      />

      {menuItems
        .filter((item) => item.show)
        .map((item) => (
          <span key={item.key} style={{ display: "contents" }}>
            <MenuDivider />
            {item.node}
          </span>
        ))}

    </div>
  );
}
