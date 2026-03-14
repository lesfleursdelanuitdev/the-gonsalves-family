"use client";

import { LegendLineDiamond } from "../SvgIcons/LegendLineDiamond";
import { ChartPanel } from "./ChartPanel";

export interface LegendPanelProps {
  items: { label: string; color: string }[];
  onClose: () => void;
  maxDepth?: number;
}

export function LegendPanel({ items, onClose, maxDepth: _maxDepth }: LegendPanelProps) {
  void _maxDepth;

  const headerCloseButton = (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      style={{
        background: "none",
        border: "none",
        color: "var(--tree-text-muted)",
        cursor: "pointer",
        fontSize: 14,
        padding: 0,
        lineHeight: 1,
      }}
    >
      ✕
    </button>
  );

  return (
    <ChartPanel
      title="Sibling View Legend"
      onClose={onClose}
      placement={{ top: 70, right: 16 }}
      minWidth={240}
      zIndex={200}
      headerRight={headerCloseButton}
      containerStyle={{ padding: "14px 18px" }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 7,
          }}
        >
          <LegendLineDiamond color={item.color} size="small" />
          <span
            style={{
              color: "var(--tree-text)",
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </ChartPanel>
  );
}
