"use client";

import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";

export interface ChartTypeModalProps {
  open: boolean;
  value: ChartViewStrategyName;
  onClose: () => void;
  onSelect: (next: ChartViewStrategyName) => void;
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 250,
};

const panel: React.CSSProperties = {
  background: "var(--tree-surface-dim)",
  border: "1px solid var(--tree-border)",
  borderRadius: 14,
  padding: "24px 28px",
  maxWidth: 400,
  width: "90%",
  boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
};

const optionBase: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  border: "1px solid var(--tree-border)",
  borderRadius: 10,
  padding: "12px 14px",
  marginTop: 10,
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
  background: "rgba(229, 220, 200, 0.35)",
  color: "var(--tree-text)",
};

const previewWrap: React.CSSProperties = {
  flexShrink: 0,
  width: 54,
  height: 54,
  color: "var(--tree-text-muted)",
  opacity: 0.92,
};

/** Same two-generation fork (1 parent, 2 children); only orientation changes. */
function TwoGenForkSkeleton({ orientation }: { orientation: "down" | "right" | "up" }) {
  const stroke = { stroke: "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, opacity: 0.48 };
  const parent = { fill: "currentColor", opacity: 0.38, rx: 2 };
  const child = { fill: "currentColor", opacity: 0.28, rx: 2 };

  if (orientation === "down") {
    return (
      <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden>
        <rect x="15" y="5" width="18" height="9" {...parent} />
        <path d="M24 14v5M24 19L10 30M24 19L38 30" {...stroke} fill="none" />
        <rect x="4" y="31" width="14" height="10" {...child} />
        <rect x="30" y="31" width="14" height="10" {...child} />
      </svg>
    );
  }
  if (orientation === "right") {
    return (
      <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden>
        <rect x="5" y="16" width="10" height="16" {...parent} />
        <path d="M15 24h6M21 24L33 12M21 24L33 36" {...stroke} fill="none" />
        <rect x="33" y="5" width="10" height="12" {...child} />
        <rect x="33" y="31" width="10" height="12" {...child} />
      </svg>
    );
  }
  /* up */
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden>
      <rect x="15" y="34" width="18" height="9" {...parent} />
      <path d="M24 34v-5M24 29L10 18M24 29L38 18" {...stroke} fill="none" />
      <rect x="4" y="5" width="14" height="10" {...child} />
      <rect x="30" y="5" width="14" height="10" {...child} />
    </svg>
  );
}

export function ChartTypeModal({ open, value, onClose, onSelect }: ChartTypeModalProps) {
  if (!open) return null;

  const select = (next: ChartViewStrategyName) => {
    onSelect(next);
    onClose();
  };

  return (
    <div style={overlay} onClick={onClose} role="presentation">
      <div
        style={panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-type-modal-title"
      >
        <div
          id="chart-type-modal-title"
          style={{
            color: "var(--tree-text)",
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 4,
            fontFamily: "var(--font-heading-raw), Georgia, serif",
          }}
        >
          Chart type
        </div>
        <p
          style={{
            color: "var(--tree-text-muted)",
            fontSize: 12,
            marginBottom: 8,
            lineHeight: 1.5,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Choose how the tree is drawn. You can change this anytime.
        </p>

        <button
          type="button"
          style={{
            ...optionBase,
            marginTop: 14,
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            outline: value === "descendancy" ? "2px solid var(--tree-root)" : undefined,
            outlineOffset: 2,
            background:
              value === "descendancy" ? "rgba(26, 61, 42, 0.12)" : optionBase.background,
          }}
          onClick={() => select("descendancy")}
        >
          <div style={previewWrap}>
            <TwoGenForkSkeleton orientation="down" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Descendancy</div>
            <div style={{ fontSize: 12, color: "var(--tree-text-muted)", marginTop: 4, lineHeight: 1.45 }}>
              Descendants branch from the root downward — spouses and children by generation.
            </div>
          </div>
        </button>

        <button
          type="button"
          style={{
            ...optionBase,
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            outline: value === "pedigree" ? "2px solid var(--tree-root)" : undefined,
            outlineOffset: 2,
            background: value === "pedigree" ? "rgba(26, 61, 42, 0.12)" : optionBase.background,
          }}
          onClick={() => select("pedigree")}
        >
          <div style={previewWrap}>
            <TwoGenForkSkeleton orientation="right" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Pedigree</div>
            <div style={{ fontSize: 12, color: "var(--tree-text-muted)", marginTop: 4, lineHeight: 1.45 }}>
              Ancestors extend left to right — parents, grandparents, and placeholders for gaps.
            </div>
          </div>
        </button>

        <button
          type="button"
          style={{
            ...optionBase,
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            outline: value === "vertical_pedigree" ? "2px solid var(--tree-root)" : undefined,
            outlineOffset: 2,
            background:
              value === "vertical_pedigree" ? "rgba(26, 61, 42, 0.12)" : optionBase.background,
          }}
          onClick={() => select("vertical_pedigree")}
        >
          <div style={previewWrap}>
            <TwoGenForkSkeleton orientation="up" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Vertical Pedigree</div>
            <div style={{ fontSize: 12, color: "var(--tree-text-muted)", marginTop: 4, lineHeight: 1.45 }}>
              Ancestors grow upward from the root — same data as pedigree, stacked by generation.
            </div>
          </div>
        </button>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid var(--tree-border)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12,
              cursor: "pointer",
              background: "rgba(229, 220, 200, 0.55)",
              color: "var(--tree-text-muted)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
