"use client";

interface ChartHeaderSiblingLegendButtonProps {
  showLegendPanel: boolean;
  onToggleLegendPanel: () => void;
}

export function ChartHeaderSiblingLegendButton({
  showLegendPanel,
  onToggleLegendPanel,
}: ChartHeaderSiblingLegendButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggleLegendPanel}
      style={{
        background: showLegendPanel ? "var(--hover-overlay)" : "transparent",
        border: `1px solid ${showLegendPanel ? "var(--tree-root)" : "var(--tree-button-border)"}`,
        borderRadius: 6,
        color: showLegendPanel ? "var(--tree-root)" : "var(--tree-text-muted)",
        cursor: "pointer",
        fontSize: 11,
        padding: "5px 12px",
        fontFamily: "inherit",
        letterSpacing: "0.02em",
        transition: "all 0.15s",
      }}
    >
      Sibling Legend
    </button>
  );
}
