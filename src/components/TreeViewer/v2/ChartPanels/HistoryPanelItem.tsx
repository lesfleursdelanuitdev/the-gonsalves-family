"use client";

export interface HistoryPanelItemProps {
  index: number;
  isCurrent: boolean;
  label: string;
  onSelect: () => void;
}

export function HistoryPanelItem({ index, isCurrent, label, onSelect }: HistoryPanelItemProps) {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: "5px 10px 5px 0",
        cursor: "pointer",
        background: isCurrent ? "var(--hover-overlay)" : "transparent",
        borderLeft: `3px solid ${isCurrent ? "var(--tree-root)" : "transparent"}`,
        display: "flex",
        alignItems: "center",
        gap: 4,
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!isCurrent) e.currentTarget.style.background = "var(--hover-overlay)";
      }}
      onMouseLeave={(e) => {
        if (!isCurrent) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ color: "var(--tree-button-border)", fontSize: 10, width: 14, textAlign: "right", flexShrink: 0 }}>
        {index + 1}
      </span>
      <span
        style={{
          color: isCurrent ? "var(--tree-text)" : "var(--tree-text-muted)",
          fontSize: 12,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {label}
      </span>
      {isCurrent && <span style={{ marginLeft: "auto", color: "var(--tree-root)", fontSize: 10 }}>●</span>}
    </div>
  );
}
