"use client";

import { History } from "lucide-react";

export interface HistoryComponentProps {
  isMobile: boolean;
  showHistoryPanel: boolean;
  onHistoryClick: () => void;
}

export function HistoryComponent({
  isMobile,
  showHistoryPanel,
  onHistoryClick,
}: HistoryComponentProps) {
  return (
    <button
      type="button"
      onClick={onHistoryClick}
      title="Navigation history"
      style={{
        background: showHistoryPanel ? "var(--hover-overlay)" : "#e5dcc8",
        border: `1px solid ${showHistoryPanel ? "var(--tree-root)" : "var(--tree-border)"}`,
        borderRadius: 6,
        color: showHistoryPanel ? "var(--tree-root)" : "var(--tree-text-muted)",
        padding: "4px 8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 5,
        flexShrink: 0,
      }}
    >
      <History size={13} />
      {!isMobile && <span style={{ fontSize: 12 }}>History</span>}
    </button>
  );
}
