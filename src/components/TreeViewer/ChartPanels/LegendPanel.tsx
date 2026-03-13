"use client";

import { PanelCloseButton } from "./PanelCloseButton";
import { LegendLineDiamond } from "../ChartHeader/LegendLineDiamond";

interface LegendPanelProps {
  items: { label: string; color: string }[];
  onClose: () => void;
  maxDepth?: number;
}

export function LegendPanel({ items, onClose, maxDepth: _maxDepth }: LegendPanelProps) {
  void _maxDepth;
  return (
    <div
      style={{
        position: "fixed",
        top: 70,
        right: 16,
        minWidth: 240,
        background: "var(--tree-panel-bg)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--tree-border)",
        borderRadius: 10,
        padding: "14px 18px",
        zIndex: 200,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            color: "var(--tree-text-muted)",
            fontSize: 10,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Sibling View Legend
        </span>
        <button
          type="button"
          onClick={onClose}
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
      </div>
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
      <PanelCloseButton onClick={onClose} />
    </div>
  );
}
