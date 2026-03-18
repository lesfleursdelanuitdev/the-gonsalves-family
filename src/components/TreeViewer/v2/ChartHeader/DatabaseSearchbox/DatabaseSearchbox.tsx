"use client";

import type { DescendancyPerson } from "@/genealogy-visualization-engine";
import { Search } from "lucide-react";
import { DesktopDatabaseSearchboxInputs } from "./DesktopDatabaseSearchboxInputs";
import { DesktopDatabaseSearchboxResults } from "./DesktopDatabaseSearchboxResults";
import { MobileDatabaseSearchbox } from "./MobileDatabaseSearchbox";

export interface DatabaseSearchboxProps {
  isMobile: boolean;
  searchGivenName: string;
  searchLastName: string;
  onSearchGivenNameChange: (v: string) => void;
  onSearchLastNameChange: (v: string) => void;
  searchResults: DescendancyPerson[];
  searchLoading?: boolean;
  selectedRootId?: string;
  onSelectResult: (person: DescendancyPerson) => void;
  setShowSearchPanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  /** Mobile only: when set, the search control is a link to this href (dedicated search page). */
  mobileSearchHref?: string;
}

export function DatabaseSearchbox({
  isMobile,
  searchGivenName,
  searchLastName,
  onSearchGivenNameChange,
  onSearchLastNameChange,
  searchResults,
  searchLoading = false,
  selectedRootId,
  onSelectResult,
  setShowSearchPanel,
  mobileSearchHref,
}: DatabaseSearchboxProps) {
  const hasQuery = searchGivenName.trim() || searchLastName.trim();

  const clearAndClose = () => {
    onSearchGivenNameChange("");
    onSearchLastNameChange("");
    setShowSearchPanel(false);
  };

  if (isMobile && mobileSearchHref) {
    return (
      <MobileDatabaseSearchbox href={mobileSearchHref} title="Search the database" />
    );
  }
  else if (isMobile) {
    return null;
  }

  return (
    <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
      <Search size={13} style={{ color: "var(--tree-text-subtle)", flexShrink: 0 }} />
      <DesktopDatabaseSearchboxInputs
        searchGivenName={searchGivenName}
        searchLastName={searchLastName}
        onSearchGivenNameChange={onSearchGivenNameChange}
        onSearchLastNameChange={onSearchLastNameChange}
      />
      {hasQuery && (
        <DesktopDatabaseSearchboxResults
          searchResults={searchResults}
          searchLoading={searchLoading}
          selectedRootId={selectedRootId}
          onSelectResult={onSelectResult}
          onClose={clearAndClose}
        />
      )}
    </div>
  );
}
