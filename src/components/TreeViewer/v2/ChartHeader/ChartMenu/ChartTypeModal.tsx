"use client";

import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { ChartDrawer } from "../../ChartDrawers/ChartDrawer";

export interface ChartTypeModalProps {
  open: boolean;
  value: ChartViewStrategyName;
  /** Compact grid + vertical cards; on mobile the picker is a right-edge drawer (portaled). */
  isMobile?: boolean;
  onClose: () => void;
  onSelect: (next: ChartViewStrategyName) => void | Promise<void>;
}

const overlayBase: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "flex",
  justifyContent: "center",
  zIndex: 250,
};

const panelBase: React.CSSProperties = {
  background: "var(--tree-surface-dim)",
  border: "1px solid var(--tree-border)",
  borderRadius: 14,
  boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
};

const optionBase: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  border: "1px solid var(--tree-border)",
  borderRadius: 10,
  padding: "12px 14px",
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
  background: "rgba(229, 220, 200, 0.35)",
  color: "var(--tree-text)",
};

const previewWrapDesktop: React.CSSProperties = {
  flexShrink: 0,
  width: 54,
  height: 54,
  color: "var(--tree-text-muted)",
  opacity: 0.92,
};

const previewWrapMobile: React.CSSProperties = {
  flexShrink: 0,
  width: 48,
  height: 48,
  margin: "0 auto 8px",
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

function FanSkeleton() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden>
      <path d="M6 24A18 18 0 0 1 42 24L34 24A10 10 0 0 0 14 24Z" fill="currentColor" opacity={0.24} />
      <path d="M14 24A10 10 0 0 1 34 24L27 24A3 3 0 0 0 21 24Z" fill="currentColor" opacity={0.36} />
      <circle cx="24" cy="24" r="3" fill="currentColor" opacity={0.5} />
    </svg>
  );
}

type OptionDef = {
  value: ChartViewStrategyName;
  title: string;
  description: string;
  skeleton: React.ReactNode;
};

const CHART_OPTIONS: OptionDef[] = [
  {
    value: "descendancy",
    title: "Descendancy",
    description:
      "Descendants branch from the root downward — spouses and children by generation.",
    skeleton: <TwoGenForkSkeleton orientation="down" />,
  },
  {
    value: "fan_chart",
    title: "Fan Chart",
    description:
      "Ancestors are rendered as annular fan sectors radiating from the root, with curved labels and optional avatars.",
    skeleton: <FanSkeleton />,
  },
  {
    value: "pedigree",
    title: "Pedigree",
    description:
      "Ancestors extend left to right — parents, grandparents, and placeholders for gaps. If the root person belongs to more than one family as a child, you will be asked which family line to use.",
    skeleton: <TwoGenForkSkeleton orientation="right" />,
  },
  {
    value: "vertical_pedigree",
    title: "Vertical Pedigree",
    description:
      "Ancestors grow upward from the root — same data as pedigree, stacked by generation (same family choice when the root has multiple families as a child).",
    skeleton: <TwoGenForkSkeleton orientation="up" />,
  },
];

const CHART_TYPE_MODAL_TITLE_ID = "chart-type-modal-title";

/** Same z-index as the previous full-screen chart overlay so the sheet stays above the sticky menu. */
const MOBILE_CHART_TYPE_DRAWER_Z = 250;

function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function ChartTypeModal({ open, value, isMobile = false, onClose, onSelect }: ChartTypeModalProps) {
  const isMounted = useIsMounted();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!open || !isMobile) {
      setDrawerOpen(false);
      return;
    }
    const id = requestAnimationFrame(() => setDrawerOpen(true));
    return () => cancelAnimationFrame(id);
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || !isMobile || !drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isMobile, drawerOpen, onClose]);

  if (!open) return null;

  const select = (next: ChartViewStrategyName) => {
    onSelect(next);
    onClose();
  };

  const optionsGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr",
    gap: isMobile ? 8 : 10,
    marginTop: isMobile ? 10 : 12,
    alignItems: "start",
  };

  const titleFontSize = isMobile ? 15 : 16;
  const blurbFontSize = isMobile ? 11 : 12;
  const cardTitleSize = isMobile ? 13 : 14;
  const cardBodySize = isMobile ? 11 : 12;

  const optionsBlock = (
    <div style={optionsGrid}>
      {CHART_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        const rowLayout = !isMobile;

        return (
          <button
            key={opt.value}
            type="button"
            style={{
              ...optionBase,
              display: "flex",
              flexDirection: rowLayout ? "row" : "column",
              alignItems: rowLayout ? "flex-start" : "stretch",
              textAlign: rowLayout ? "left" : "center",
              gap: rowLayout ? 12 : 0,
              padding: isMobile ? "10px 8px" : optionBase.padding,
              outline: selected ? "2px solid var(--tree-root)" : undefined,
              outlineOffset: 2,
              background: selected ? "rgba(26, 61, 42, 0.12)" : optionBase.background,
            }}
            onClick={() => select(opt.value)}
          >
            <div style={rowLayout ? previewWrapDesktop : previewWrapMobile}>{opt.skeleton}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: cardTitleSize }}>{opt.title}</div>
              <div
                style={{
                  fontSize: cardBodySize,
                  color: "var(--tree-text-muted)",
                  marginTop: 4,
                  lineHeight: 1.45,
                }}
              >
                {opt.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  if (isMobile) {
    if (!isMounted) return null;
    return createPortal(
      <ChartDrawer
        open={drawerOpen}
        anchor="right"
        onClose={onClose}
        showBackdrop
        zIndex={MOBILE_CHART_TYPE_DRAWER_Z}
        ariaLabelledBy={CHART_TYPE_MODAL_TITLE_ID}
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: 0,
          width: "min(100vw, 400px)",
          maxWidth: "100vw",
          height: "100%",
          maxHeight: "100dvh",
          borderRadius: "14px 0 0 14px",
          borderRight: "none",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: "12px 14px 10px max(14px, env(safe-area-inset-right, 0px))",
            borderBottom: "1px solid var(--tree-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div
            id={CHART_TYPE_MODAL_TITLE_ID}
            style={{
              color: "var(--tree-text)",
              fontSize: titleFontSize,
              fontWeight: 600,
              fontFamily: "var(--font-heading-raw), Georgia, serif",
              minWidth: 0,
            }}
          >
            Chart type
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--tree-text-subtle)",
              fontSize: 22,
              lineHeight: 1,
              padding: 4,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "12px 14px 16px max(14px, env(safe-area-inset-right, 0px))",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <p
            style={{
              color: "var(--tree-text-muted)",
              fontSize: blurbFontSize,
              marginTop: 0,
              marginBottom: 0,
              lineHeight: 1.5,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Choose how the tree is drawn. You can change this anytime.
          </p>
          {optionsBlock}
        </div>
      </ChartDrawer>,
      document.body
    );
  }

  const overlay: React.CSSProperties = {
    ...overlayBase,
    alignItems: "center",
    padding: 0,
    boxSizing: "border-box",
  };

  const panel: React.CSSProperties = {
    ...panelBase,
    maxWidth: 400,
    width: "90%",
    padding: "24px 28px",
    flexShrink: 0,
  };

  return (
    <div style={overlay} onClick={onClose} role="presentation">
      <div
        style={panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={CHART_TYPE_MODAL_TITLE_ID}
      >
        <div
          id={CHART_TYPE_MODAL_TITLE_ID}
          style={{
            color: "var(--tree-text)",
            fontSize: titleFontSize,
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
            fontSize: blurbFontSize,
            marginBottom: 0,
            lineHeight: 1.5,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Choose how the tree is drawn. You can change this anytime.
        </p>

        {optionsBlock}

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
