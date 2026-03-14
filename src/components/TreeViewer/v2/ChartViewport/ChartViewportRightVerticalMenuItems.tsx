"use client";

import { ZoomControls } from "./ZoomControls";
import { PanControls } from "./PanControls";
import { Map, Info, Bug, HelpCircle } from "lucide-react";

export type ChartViewportRightVerticalMenuEntry =
  | {
      id: string;
      kind: "single";
      show: boolean;
      ariaLabel: string;
      content: React.ReactNode;
    }
  | {
      id: string;
      kind: "component";
      show: boolean;
      content: React.ReactNode;
    };

export interface ChartViewportRightVerticalMenuItemsProps {
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

const iconColor = "#474131";

const buttonBaseStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "none",
  background: "transparent",
  color: iconColor,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export function getChartViewportRightVerticalMenuItems(
  props: ChartViewportRightVerticalMenuItemsProps
): ChartViewportRightVerticalMenuEntry[] {
  const {
    isMobile,
    scale,
    onZoomIn,
    onZoomOut,
    onFitToScreen,
    onPan,
    showDebugPanel = false,
    onToggleDebugPanel,
    showMinimapToggle,
    minimapOpen,
    onMinimapOpen,
    hasSiblingView = false,
    showLegendPanel = false,
    onToggleLegendPanel,
    onOpenTutorial,
  } = props;

  return [
    {
      id: "help",
      kind: "single",
      show: Boolean(onOpenTutorial),
      ariaLabel: "Help / Tutorial",
      content: (
        <button
          type="button"
          onClick={onOpenTutorial}
          aria-label="Open tutorial"
          style={buttonBaseStyle}
        >
          <HelpCircle size={16} strokeWidth={2} />
        </button>
      ),
    },
    {
      id: "debug",
      kind: "single",
      show: Boolean(onToggleDebugPanel && !isMobile),
      ariaLabel: "Debug panel",
      content: (
        <button
          type="button"
          onClick={onToggleDebugPanel}
          aria-label={showDebugPanel ? "Close debug panel" : "Open debug panel"}
          aria-pressed={showDebugPanel}
          style={{
            ...buttonBaseStyle,
            background: showDebugPanel ? "var(--hover-overlay)" : undefined,
            color: iconColor,
          }}
        >
          <Bug size={16} strokeWidth={2} />
        </button>
      ),
    },
    {
      id: "zoom",
      kind: "component",
      show: true,
      content: (
        <ZoomControls
          scale={scale}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFitToScreen={onFitToScreen}
        />
      ),
    },
    {
      id: "pan",
      kind: "component",
      show: true,
      content: <PanControls onPan={onPan} />,
    },
    {
      id: "minimap",
      kind: "single",
      show: showMinimapToggle && !minimapOpen,
      ariaLabel: "Show minimap",
      content: (
        <button
          type="button"
          onClick={onMinimapOpen}
          aria-label="Show minimap"
          style={buttonBaseStyle}
        >
          <Map size={16} strokeWidth={2} />
        </button>
      ),
    },
    {
      id: "legend",
      kind: "single",
      show: isMobile && hasSiblingView && Boolean(onToggleLegendPanel),
      ariaLabel: "Sibling legend",
      content: (
        <button
          type="button"
          onClick={onToggleLegendPanel}
          aria-label="Sibling legend"
          style={{
            ...buttonBaseStyle,
            background: showLegendPanel ? "var(--hover-overlay)" : undefined,
            color: iconColor,
          }}
        >
          <Info size={16} strokeWidth={2} />
        </button>
      ),
    },
  ];
}
