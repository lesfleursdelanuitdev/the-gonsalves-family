"use client";

import Link from "next/link";
import type { DescendancyPerson } from "@/descendancy-chart";
import { Search, X, Check } from "lucide-react";

export { DatabaseSearchboxPanel } from "./DatabaseSearchboxPanel";

export interface DatabaseSearchboxProps {
  isMobile: boolean;
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
  onSelectResult: (person: DescendancyPerson) => void;
  showSearchPanel: boolean;
  setShowSearchPanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  /** Mobile only: when set, the search control is a link to this href (dedicated search page). */
  mobileSearchHref?: string;
  /** Mobile only: called when the search toggle button is clicked (when mobileSearchHref is not set). */
  onToggleSearchPanel?: () => void;
}

export function DatabaseSearchbox({
  isMobile,
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
  onSelectResult,
  showSearchPanel,
  setShowSearchPanel,
  mobileSearchHref,
  onToggleSearchPanel,
}: DatabaseSearchboxProps) {
  const hasQuery = searchGivenName.trim() || searchLastName.trim();

  const clearAndClose = () => {
    onSearchGivenNameChange("");
    onSearchLastNameChange("");
    setShowSearchPanel(false);
  };

  const searchButtonStyle = {
    background: showSearchPanel ? "var(--hover-overlay)" : "#e5dcc8",
    border: `1px solid ${showSearchPanel ? "var(--tree-root)" : "var(--tree-border)"}`,
    borderRadius: 6,
    color: showSearchPanel ? "var(--tree-root)" : "var(--tree-text-muted)",
    padding: "4px 8px",
    cursor: "pointer" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  if (isMobile) {
    if (mobileSearchHref) {
      return (
        <Link
          href={mobileSearchHref}
          title="Search the database"
          style={{ ...searchButtonStyle, textDecoration: "none" }}
        >
          <Search size={13} />
        </Link>
      );
    }
    return (
      <button
        type="button"
        onClick={onToggleSearchPanel}
        title="Search"
        style={searchButtonStyle}
      >
        <Search size={13} />
      </button>
    );
  }

  // Desktop: inline search inputs + dropdown
  const inputStyles = {
    background: "var(--surface-inset)",
    border: "1px solid var(--tree-border)",
    borderRadius: 6,
    color: "var(--tree-text)",
    fontSize: 12,
    padding: "5px 10px",
    outline: "none",
    fontFamily: "inherit",
  } as const;

  return (
    <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
      <Search size={13} style={{ color: "var(--tree-text-subtle)", flexShrink: 0 }} />
      <input
        value={searchGivenName}
        onChange={(e) => onSearchGivenNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onSearchGivenNameChange("");
            onSearchLastNameChange("");
          }
        }}
        placeholder="Given name"
        style={{ ...inputStyles, width: 100 }}
      />
      <input
        value={searchLastName}
        onChange={(e) => onSearchLastNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onSearchGivenNameChange("");
            onSearchLastNameChange("");
          }
        }}
        placeholder="Last name"
        style={{ ...inputStyles, width: 100 }}
      />
      {hasQuery && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            background: "var(--tree-panel-bg)",
            border: "1px solid var(--tree-border)",
            borderRadius: 8,
            minWidth: 220,
            zIndex: 400,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            overflow: "hidden",
          }}
        >
          {searchLoading ? (
            <div style={{ padding: "10px 14px", color: "var(--tree-text-muted)", fontSize: 12 }}>
              Searching…
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ padding: "10px 14px", color: "var(--tree-text-muted)", fontSize: 12 }}>
              No results
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {searchResults.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => onSelectResult(p)}
                  style={{
                    padding: "8px 14px",
                    cursor: "pointer",
                    color: "var(--tree-text)",
                    borderBottom: i === searchResults.length - 1 ? "none" : "1px solid var(--tree-border)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-overlay)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>
                      {p.firstName} {p.lastName}
                    </span>
                    {p.id === selectedRootId && (
                      <Check size={14} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={3} />
                    )}
                  </span>
                  {p.birthYear != null && (
                    <span style={{ color: "var(--tree-text-muted)", marginLeft: 8 }}>b. {p.birthYear}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {searchHasMore && (
            <button
              type="button"
              onClick={onSearchLoadMore}
              disabled={searchLoadingMore}
              title="Load more results"
              style={{
                width: "100%",
                padding: "8px 14px",
                border: "none",
                borderTop: "1px solid var(--tree-border)",
                background: "#e5dcc8",
                color: "var(--tree-text-muted)",
                fontSize: 12,
                cursor: searchLoadingMore ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => {
                if (!searchLoadingMore) {
                  e.currentTarget.style.background = "var(--hover-overlay)";
                  e.currentTarget.style.color = "var(--tree-text)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#e5dcc8";
                e.currentTarget.style.color = "var(--tree-text-muted)";
              }}
            >
              {searchLoadingMore ? "Loading…" : "Load more"}
            </button>
          )}
          <button
            type="button"
            onClick={clearAndClose}
            title="Close search"
            style={{
              width: "100%",
              padding: "8px 14px",
              border: "none",
              borderTop: "1px solid var(--tree-border)",
              background: "#e5dcc8",
              color: "var(--tree-text-muted)",
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--hover-overlay)";
              e.currentTarget.style.color = "var(--tree-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#e5dcc8";
              e.currentTarget.style.color = "var(--tree-text-muted)";
            }}
          >
            <X size={14} />
            Close
          </button>
        </div>
      )}
    </div>
  );
}
