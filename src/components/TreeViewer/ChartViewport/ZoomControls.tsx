"use client";

import { Maximize2 } from "lucide-react";

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;

/** Shared button style: flush in a single panel, RF Controls–style, theme colors */
const buttonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "none",
  background: "transparent",
  color: "var(--tree-text)",
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
    <>
      <style>{`
        .zoom-controls-panel button:not(:disabled):hover {
          background: var(--tree-button-bg) !important;
        }
      `}</style>
      <div
        role="group"
        aria-label="Zoom controls"
        className="zoom-controls-panel"
        style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 6,
          background: "var(--tree-panel-bg)",
          border: "1px solid var(--tree-panel-border)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
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
      </div>
    </>
  );
}
