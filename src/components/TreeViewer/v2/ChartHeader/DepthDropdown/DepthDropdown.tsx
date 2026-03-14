"use client";

import { DEFAULT_MAX_DEPTH } from "@/descendancy-chart";

const DEPTH_OPTIONS = Array.from({ length: DEFAULT_MAX_DEPTH }, (_, i) => i + 1);

const CHEVRON_DATA_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5b4f' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

export interface DepthDropdownProps {
  maxDepth: number;
  /** When set, the selected value reflects this (e.g. actual generations in tree) instead of maxDepth. */
  displayedDepth?: number;
  onMaxDepthChange: (n: number) => void;
  /**
   * "toolbar" = compact, for use in chart header.
   * "settings" = larger touch target and "X generation(s)" in options, for use in settings panel.
   */
  variant?: "toolbar" | "settings";
  /** When true, show "Depth:" label before the select. Default true. */
  showLabel?: boolean;
}

/** Depth dropdown for embedding in header or settings panel. No panel or modal. */
export function DepthDropdown({
  maxDepth,
  displayedDepth,
  onMaxDepthChange,
  variant = "toolbar",
  showLabel = true,
}: DepthDropdownProps) {
  const currentDepth = Math.max(1, Math.min(displayedDepth ?? maxDepth, DEFAULT_MAX_DEPTH));
  const isSettings = variant === "settings";

  const selectStyle: React.CSSProperties = isSettings
    ? {
        fontSize: 12,
        padding: "6px 28px 6px 10px",
        borderRadius: 6,
        border: "1px solid var(--tree-border)",
        background: "var(--tree-panel-bg)",
        color: "var(--tree-text)",
        cursor: "pointer",
        flex: 1,
        maxWidth: 120,
        appearance: "none",
        backgroundImage: CHEVRON_DATA_URL,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }
    : {
        fontSize: 11,
        padding: "2px 20px 2px 6px",
        borderRadius: 6,
        border: "1px solid var(--tree-border)",
        background: "#e5dcc8",
        color: "var(--tree-text)",
        cursor: "pointer",
        appearance: "none",
        backgroundImage: CHEVRON_DATA_URL,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 4px center",
      };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: isSettings ? 12 : 6,
        color: "var(--tree-text-muted)",
        flexShrink: 0,
        ...(isSettings && { width: "100%" }),
      }}
    >
      {showLabel && (
        <span
          style={{
            fontSize: 11,
            whiteSpace: "nowrap",
            ...(isSettings && { fontFamily: "system-ui, sans-serif" }),
          }}
        >
          Depth:
        </span>
      )}
      <select
        aria-label="Generations to show"
        value={currentDepth}
        onChange={(e) => onMaxDepthChange(Number(e.target.value))}
        style={selectStyle}
      >
        {DEPTH_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {isSettings ? `${n} ${n === 1 ? "generation" : "generations"}` : n}
          </option>
        ))}
      </select>
    </div>
  );
}
