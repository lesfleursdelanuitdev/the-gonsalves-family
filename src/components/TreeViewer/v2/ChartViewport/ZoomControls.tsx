"use client";

import { Maximize2 } from "lucide-react";
import { ChartViewportRightVerticalMenuItem } from "./ChartViewportRightVerticalMenuItem";

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;

const buttonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "none",
  background: "transparent",
  color: "#474131",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
}

export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
}: ZoomControlsProps) {
  const zoomInDisabled = scale >= ZOOM_MAX;
  const zoomOutDisabled = scale <= ZOOM_MIN;

  return (
    <ChartViewportRightVerticalMenuItem ariaLabel="Zoom controls">
      <button
        type="button"
        onClick={onZoomIn}
        disabled={zoomInDisabled}
        aria-label="Zoom in"
        style={{
          ...buttonStyle,
          opacity: zoomInDisabled ? 0.5 : 1,
          cursor: zoomInDisabled ? "not-allowed" : "pointer",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 600, lineHeight: 1 }}>+</span>
      </button>
      <div
        style={{
          height: 1,
          background: "var(--tree-panel-border)",
          margin: "0 4px",
        }}
      />
      <button
        type="button"
        onClick={onFitToScreen}
        aria-label="Fit to screen"
        style={buttonStyle}
      >
        <Maximize2 size={14} strokeWidth={2} />
      </button>
      <div
        style={{
          height: 1,
          background: "var(--tree-panel-border)",
          margin: "0 4px",
        }}
      />
      <button
        type="button"
        onClick={onZoomOut}
        disabled={zoomOutDisabled}
        aria-label="Zoom out"
        style={{
          ...buttonStyle,
          opacity: zoomOutDisabled ? 0.5 : 1,
          cursor: zoomOutDisabled ? "not-allowed" : "pointer",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 600, lineHeight: 1 }}>−</span>
      </button>
    </ChartViewportRightVerticalMenuItem>
  );
}
