"use client";

import { useState, useEffect } from "react";
import { UserCircle, Heart } from "lucide-react";

const BOTTOM_BAR_HEIGHT = 44;

export interface ChartViewportBottomBarProps {
  isMobile: boolean;
  onGoToPerson: () => void;
  onToggleAllSpouses: () => void;
}

export function ChartViewportBottomBar({
  isMobile,
  onGoToPerson,
  onToggleAllSpouses,
}: ChartViewportBottomBarProps) {
  const BOTTOM_OFFSET = isMobile ? 0 : 10;
  const [bottomBarStyle, setBottomBarStyle] = useState<{
    top?: number;
    left?: number;
    bottom?: number;
    transform: string;
  }>({ bottom: BOTTOM_OFFSET, transform: "translateX(-50%)" });
  const [bottomBarVisible, setBottomBarVisible] = useState(false);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const offset = isMobile ? 0 : 10;
    let showTimeout: ReturnType<typeof setTimeout> | null = null;
    const SETTLE_MS = 150;

    const update = () => {
      setBottomBarStyle({
        top: vv.offsetTop + vv.height - offset - BOTTOM_BAR_HEIGHT,
        left: vv.offsetLeft + vv.width / 2,
        transform: "translate(-50%, 0)",
      });
      setBottomBarVisible(false);
      if (showTimeout) clearTimeout(showTimeout);
      showTimeout = setTimeout(() => setBottomBarVisible(true), SETTLE_MS);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      if (showTimeout) clearTimeout(showTimeout);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <div
      className="chart-viewport-bottom-buttons"
      style={{
        position: "fixed",
        ...bottomBarStyle,
        zIndex: 10,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        gap: 8,
        opacity: bottomBarVisible ? 1 : 0,
        pointerEvents: bottomBarVisible ? "auto" : "none",
        transition: "opacity 0.15s ease-out",
      }}
    >
      <style>{`
        .chart-viewport-bottom-btn:hover {
          background: var(--tree-button-bg) !important;
        }
      `}</style>
      <div
        role="group"
        aria-label="Go to person"
        style={{
          borderRadius: 6,
          background: "var(--tree-panel-bg)",
          border: "1px solid var(--tree-panel-border)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={onGoToPerson}
          aria-label="Go to person"
          className="chart-viewport-bottom-btn"
          style={{
            padding: "8px 12px",
            border: "none",
            background: "transparent",
            color: "var(--tree-text)",
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <UserCircle size={14} strokeWidth={2} />
          Go To Person
        </button>
      </div>
      <div
        role="group"
        aria-label="Toggle all partners"
        style={{
          borderRadius: 6,
          background: "var(--tree-panel-bg)",
          border: "1px solid var(--tree-panel-border)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={onToggleAllSpouses}
          aria-label="Toggle all partners"
          className="chart-viewport-bottom-btn"
          style={{
            padding: "8px 12px",
            border: "none",
            background: "transparent",
            color: "var(--tree-text)",
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Heart size={14} strokeWidth={2} />
          Toggle All Partners
        </button>
      </div>
    </div>
  );
}
