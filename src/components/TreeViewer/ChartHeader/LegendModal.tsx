"use client";

import type { ViewState } from "@/descendancy-chart";
import { buildLegendItems } from "@/descendancy-chart";
import { LegendLineDiamond } from "./LegendLineDiamond";

export interface LegendModalProps {
  open: boolean;
  viewState: ViewState;
  effectiveRootId: string;
  onClose: () => void;
}

export function LegendModal({
  open,
  viewState,
  effectiveRootId,
  onClose,
}: LegendModalProps) {
  if (!open || !viewState.siblingView) return null;
  const items = buildLegendItems(
    viewState.siblingView,
    effectiveRootId,
    viewState
  );
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 250,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--tree-surface-dim)",
          border: "1px solid var(--tree-border)",
          borderRadius: 14,
          padding: "28px 32px",
          maxWidth: 360,
          width: "90%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            color: "var(--tree-text)",
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 6,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Sibling View
        </div>
        <p
          style={{
            color: "var(--tree-text-muted)",
            fontSize: 12,
            marginBottom: 20,
            lineHeight: 1.6,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Connector line colours show which family each person belongs to.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
                fontSize: 13,
                color: "var(--tree-text)",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              <LegendLineDiamond color={item.color} size="medium" />
              {item.label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "9px 0",
            background: "var(--hover-overlay)",
            border: "1px solid var(--tree-root)",
            borderRadius: 7,
            color: "var(--tree-root)",
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
