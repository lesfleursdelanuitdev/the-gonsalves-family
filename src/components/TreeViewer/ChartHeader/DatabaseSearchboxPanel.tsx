"use client";

import { useEffect } from "react";
import type { DescendancyPerson } from "@/descendancy-chart";
import { X, Check } from "lucide-react";

export interface DatabaseSearchboxPanelProps {
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
  setShowSearchPanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  /** When true, render as a centered modal (narrower/shorter than viewport) instead of slide-down. */
  asModal?: boolean;
  /** When true, render as full-screen overlay with overflowY auto (keyboard-safe on mobile; canvas is hidden by parent). */
  fullScreenOverlay?: boolean;
}

/** Mobile-only panel with search inputs and results. Slide-down inline or centered modal when asModal. */
export function DatabaseSearchboxPanel({
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
  setShowSearchPanel,
  asModal = false,
  fullScreenOverlay = false,
}: DatabaseSearchboxPanelProps) {
  const hasQuery = searchGivenName.trim() || searchLastName.trim();

  useEffect(() => {
    console.log("Search database is on the screen");
  }, []);

  const clearAndClose = () => {
    onSearchGivenNameChange("");
    onSearchLastNameChange("");
    setShowSearchPanel(false);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const inputStylesMobile = {
    background: "var(--surface-inset)",
    border: "1px solid var(--tree-border)",
    borderRadius: 6,
    color: "var(--tree-text)",
    fontSize: asModal || fullScreenOverlay ? 12 : 13,
    padding: asModal || fullScreenOverlay ? "6px 8px" : "7px 10px",
    width: "100%" as const,
    outline: "none",
    fontFamily: "system-ui, sans-serif",
  };

  const content = (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          autoFocus
          value={searchGivenName}
          onChange={(e) => onSearchGivenNameChange(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={(e) => {
            if (e.key === "Escape") clearAndClose();
          }}
          placeholder="Given name"
          style={inputStylesMobile}
        />
        <input
          value={searchLastName}
          onChange={(e) => onSearchLastNameChange(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={(e) => {
            if (e.key === "Escape") clearAndClose();
          }}
          placeholder="Last name"
          style={inputStylesMobile}
        />
      </div>
      {hasQuery && (
        <div style={{ marginTop: 6, borderRadius: 8, border: "1px solid var(--tree-border)", overflow: "hidden" }}>
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
                onClick={() => {
                  onSelectResult(p);
                  setShowSearchPanel(false);
                }}
                style={{
                  padding: "8px 14px",
                  cursor: "pointer",
                  color: "var(--tree-text)",
                  fontSize: 12,
                  borderBottom: i === searchResults.length - 1 ? "none" : "1px solid var(--tree-border)",
                  background: "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-overlay)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>
                    {p.firstName} {p.lastName}
                  </span>
                  {p.id === selectedRootId && (
                    <Check size={12} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={3} />
                  )}
                </span>
                {p.birthYear != null && (
                  <span style={{ color: "var(--tree-text-muted)", marginLeft: 6, fontSize: 11 }}>b. {p.birthYear}</span>
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
    </>
  );

  if (fullScreenOverlay) {
    return (
      <div
        role="dialog"
        aria-label="Search database"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "var(--tree-bg)",
          display: "flex",
          flexDirection: "column",
          padding: "1rem",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              color: "var(--tree-text)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Search Database
          </span>
          <button
            type="button"
            onClick={clearAndClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--tree-text-subtle)",
              fontSize: 16,
              lineHeight: 1,
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>{content}</div>
      </div>
    );
  }

  if (asModal) {
    return (
      <>
        <style>{`
          @keyframes searchModalFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes searchModalScale {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div
          role="dialog"
          aria-label="Search"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            animation: "searchModalFade 0.2s ease-out",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
            }}
            onClick={clearAndClose}
            aria-hidden
          />
          <div
            style={{
              position: "relative",
              background: "var(--tree-panel-bg)",
              borderRadius: 12,
              boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
              maxWidth: "min(360px, 90dvw)",
              maxHeight: "80dvh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "searchModalScale 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="search-modal-header"
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px 8px",
                borderBottom: "1px solid var(--tree-panel-border)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  color: "var(--tree-text)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Search Database
              </span>
              <button
                type="button"
                onClick={clearAndClose}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--tree-text-subtle)",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="search-modal-body" style={{ padding: "10px 14px", overflowY: "auto", flex: 1, minHeight: 0, fontSize: 12 }}>
              {content}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div
        style={{
          background: "var(--tree-surface-dim)",
          borderBottom: "1px solid var(--tree-border)",
          padding: "10px 14px",
          zIndex: 99,
          flexShrink: 0,
          animation: "slideDown 0.18s ease-out",
        }}
      >
        {content}
      </div>
    </>
  );
}
