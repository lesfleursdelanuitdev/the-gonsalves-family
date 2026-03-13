"use client";

import type { DescendancyPerson } from "@/descendancy-chart";
import type { TreeAction } from "@/descendancy-chart";
import { Home, Info, Settings, PanelTopClose, PanelTopOpen, UserCircle, Heart } from "lucide-react";
import { useCallback } from "react";
import { DatabaseSearchbox, DatabaseSearchboxPanel } from "./DatabaseSearchbox";
import { HistoryComponent } from "./HistoryComponent";
import { MenuDivider } from "./MenuDivider";
import { RootDisplayName } from "./RootDisplayName";

export interface ChartMenuRootActionDeps {
  dispatch: (action: TreeAction) => void;
  setRootDisplayNames: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  onCloseDrawer: () => void;
  setPan: (pan: { x: number; y: number }) => void;
  triggerBlinkBack: () => void;
  onGoToInitialView: () => void;
  clearSearchAndClosePanel: () => void;
  getPeople: () => Map<string, DescendancyPerson>;
}

interface ChartMenuProps {
  headerOpen: boolean;
  onToggleHeader: () => void;
  isMobile: boolean;
  rootDisplayName?: string | null;
  searchGivenName: string;
  searchLastName: string;
  onSearchGivenNameChange: (v: string) => void;
  onSearchLastNameChange: (v: string) => void;
  searchResults: DescendancyPerson[];
  searchLoading?: boolean;
  searchHasMore?: boolean;
  searchLoadingMore?: boolean;
  onSearchLoadMore?: () => void;
  selectedRootId?: string;
  /** Dependencies for select-search-result and go-home; logic runs inside ChartMenu. */
  rootActionDeps: ChartMenuRootActionDeps;
  showSearchPanel: boolean;
  setShowSearchPanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  /** When set and isMobile, search button links to this URL (e.g. /search) instead of opening the panel. */
  mobileSearchHref?: string;
  showHistoryPanel: boolean;
  setShowHistoryPanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  onHistoryClick: () => void;
  showInfo: boolean;
  onGoToPerson?: () => void;
  onToggleAllSpouses?: () => void;
  setShowInfo: (v: boolean | ((prev: boolean) => boolean)) => void;
  onInfoClick: () => void;
  showSettings: boolean;
  setShowSettings: (v: boolean | ((prev: boolean) => boolean)) => void;
  onSettingsClick: () => void;
}

export function ChartMenu({
  headerOpen,
  onToggleHeader,
  isMobile,
  rootDisplayName,
  searchGivenName,
  searchLastName,
  onSearchGivenNameChange,
  onSearchLastNameChange,
  searchResults,
  searchLoading = false,
  searchHasMore = false,
  searchLoadingMore = false,
  onSearchLoadMore,
  selectedRootId,
  rootActionDeps,
  showSearchPanel,
  setShowSearchPanel,
  mobileSearchHref,
  showHistoryPanel,
  setShowHistoryPanel,
  onHistoryClick,
  showInfo,
  setShowInfo,
  onInfoClick,
  showSettings,
  setShowSettings,
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

  return (
    <>
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
          fontSize: 12,
          position: "sticky",
          top: 0,
          zIndex: 100,
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
          searchHasMore={searchHasMore}
          searchLoadingMore={searchLoadingMore}
          onSearchLoadMore={onSearchLoadMore}
          selectedRootId={selectedRootId}
          onSelectResult={selectSearchResult}
          showSearchPanel={showSearchPanel}
          setShowSearchPanel={setShowSearchPanel}
          mobileSearchHref={mobileSearchHref}
          onToggleSearchPanel={
            isMobile && !mobileSearchHref ? () => setShowSearchPanel((v) => !v) : undefined
          }
        />

        <MenuDivider />

        <HistoryComponent
          isMobile={isMobile}
          showHistoryPanel={showHistoryPanel}
          onHistoryClick={onHistoryClick}
        />

        <button
          type="button"
          onClick={goHome}
          title="Go to current root"
          style={{
            background: "#e5dcc8",
            border: "1px solid var(--tree-border)",
            borderRadius: 6,
            color: "var(--tree-text-muted)",
            padding: "4px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--tree-text)";
            e.currentTarget.style.borderColor = "var(--tree-button-border)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--tree-text-muted)";
            e.currentTarget.style.borderColor = "var(--tree-border)";
          }}
        >
          <Home size={13} />
          {!isMobile && <span style={{ fontSize: 12 }}>Home</span>}
        </button>

        <MenuDivider />

        <button
          type="button"
          onClick={onInfoClick}
          title="Dataset info"
          style={{
            background: showInfo ? "var(--hover-overlay)" : "#e5dcc8",
            border: `1px solid ${showInfo ? "var(--tree-root)" : "var(--tree-border)"}`,
            borderRadius: 6,
            color: showInfo ? "var(--tree-root)" : "var(--tree-text-muted)",
            padding: "4px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          }}
        >
          <Info size={13} />
          {!isMobile && <span style={{ fontSize: 12 }}>Info</span>}
        </button>

        <MenuDivider />

        <button
          type="button"
          onClick={onSettingsClick}
          title="Settings"
          style={{
            background: showSettings ? "var(--hover-overlay)" : "#e5dcc8",
            border: `1px solid ${showSettings ? "var(--tree-root)" : "var(--tree-border)"}`,
            borderRadius: 6,
            color: showSettings ? "var(--tree-root)" : "var(--tree-text-muted)",
            padding: "4px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          }}
        >
          <Settings size={13} />
          {!isMobile && <span style={{ fontSize: 12 }}>Settings</span>}
        </button>

        {isMobile && onGoToPerson != null && (
          <>
            <MenuDivider />
            <button
              type="button"
              onClick={onGoToPerson}
              title="Go to person"
              style={{
                background: "#e5dcc8",
                border: "1px solid var(--tree-border)",
                borderRadius: 6,
                color: "var(--tree-text-muted)",
                padding: "4px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--tree-text)";
                e.currentTarget.style.borderColor = "var(--tree-button-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--tree-text-muted)";
                e.currentTarget.style.borderColor = "var(--tree-border)";
              }}
            >
              <UserCircle size={13} />
            </button>
          </>
        )}

        {isMobile && onToggleAllSpouses != null && (
          <>
            <MenuDivider />
            <button
              type="button"
              onClick={onToggleAllSpouses}
              title="Toggle all partners"
              style={{
                background: "#e5dcc8",
                border: "1px solid var(--tree-border)",
                borderRadius: 6,
                color: "var(--tree-text-muted)",
                padding: "4px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--tree-text)";
                e.currentTarget.style.borderColor = "var(--tree-button-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--tree-text-muted)";
                e.currentTarget.style.borderColor = "var(--tree-border)";
              }}
            >
              <Heart size={13} />
            </button>
          </>
        )}

        {!isMobile && (
          <>
            <MenuDivider />
            <button
              type="button"
              onClick={onToggleHeader}
              title={headerOpen ? "Hide header" : "Show header"}
              style={{
                background: "#e5dcc8",
                border: "1px solid var(--tree-border)",
                borderRadius: 6,
                color: "var(--tree-text-muted)",
                padding: "4px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--tree-text)";
                e.currentTarget.style.borderColor = "var(--tree-button-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--tree-text-muted)";
                e.currentTarget.style.borderColor = "var(--tree-border)";
              }}
            >
              {headerOpen ? <PanelTopClose size={13} /> : <PanelTopOpen size={13} />}
              <span style={{ fontSize: 12 }}>{headerOpen ? "Hide header" : "Show header"}</span>
            </button>
          </>
        )}

        {isMobile && <RootDisplayName rootDisplayName={rootDisplayName} />}
      </div>

      {isMobile && !mobileSearchHref && showSearchPanel && (
        <DatabaseSearchboxPanel
          searchGivenName={searchGivenName}
          searchLastName={searchLastName}
          onSearchGivenNameChange={onSearchGivenNameChange}
          onSearchLastNameChange={onSearchLastNameChange}
          searchResults={searchResults}
          searchLoading={searchLoading}
          searchHasMore={searchHasMore}
          searchLoadingMore={searchLoadingMore}
          onSearchLoadMore={onSearchLoadMore}
          selectedRootId={selectedRootId}
          onSelectResult={selectSearchResult}
          setShowSearchPanel={setShowSearchPanel}
          fullScreenOverlay
        />
      )}

    </>
  );
}
