"use client";

import { ChartViewportRightVerticalMenuItem } from "./ChartViewportRightVerticalMenuItem";
import {
  getChartViewportRightVerticalMenuItems,
  type ChartViewportRightVerticalMenuEntry,
} from "./ChartViewportRightVerticalMenuItems";

export interface ChartViewportRightVerticalMenuProps {
  isMobile: boolean;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onPan: (dx: number, dy: number) => void;
  showDebugPanel?: boolean;
  onToggleDebugPanel?: () => void;
  showMinimapToggle: boolean;
  minimapOpen: boolean;
  onMinimapOpen: () => void;
  hasSiblingView?: boolean;
  showLegendPanel?: boolean;
  onToggleLegendPanel?: () => void;
  onOpenTutorial?: () => void;
}

export function ChartViewportRightVerticalMenu(
  props: ChartViewportRightVerticalMenuProps
) {
  const { isMobile } = props;
  const menuEntries: ChartViewportRightVerticalMenuEntry[] =
    getChartViewportRightVerticalMenuItems(props);

  return (
    <div
      className={isMobile ? "chart-viewport-right-controls chart-viewport-right-controls-mobile" : "chart-viewport-right-controls"}
      style={{
        position: "absolute",
        right: 10,
        top: 10,
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 4 : 8,
        zIndex: 10,
      }}
    >
      <style>{`
        .chart-viewport-right-controls-mobile button {
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          min-height: 32px !important;
        }
        .chart-viewport-right-menu-item button:hover {
          background: var(--tree-button-bg) !important;
        }
      `}</style>
      {menuEntries.map((entry) => {
        if (!entry.show) return null;
        if (entry.kind === "single") {
          return (
            <ChartViewportRightVerticalMenuItem key={entry.id} ariaLabel={entry.ariaLabel}>
              {entry.content}
            </ChartViewportRightVerticalMenuItem>
          );
        }
        return <span key={entry.id}>{entry.content}</span>;
      })}
    </div>
  );
}
