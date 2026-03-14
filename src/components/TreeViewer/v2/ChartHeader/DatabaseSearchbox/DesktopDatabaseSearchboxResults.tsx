"use client";

import type { DescendancyPerson } from "@/descendancy-chart";
import { Check, X } from "lucide-react";

export interface DesktopDatabaseSearchboxResultsProps {
  searchResults: DescendancyPerson[];
  searchLoading?: boolean;
  selectedRootId?: string;
  onSelectResult: (person: DescendancyPerson) => void;
  /** When provided, a "Close" button is shown at the bottom of the dropdown. */
  onClose?: () => void;
}

export function DesktopDatabaseSearchboxResults({
  searchResults,
  searchLoading = false,
  selectedRootId,
  onSelectResult,
  onClose,
}: DesktopDatabaseSearchboxResultsProps) {
  return (
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
        <div style={{ maxHeight: 320, overflowY: "auto", overflowX: "hidden" }}>
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
      {onClose && (
        <button
          type="button"
          onClick={onClose}
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
      )}
    </div>
  );
}
