"use client";

import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

/** Same button style as ZoomControls for visual consistency */
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

const PAN_STEP = 48;

interface PanControlsProps {
  onPan: (dx: number, dy: number) => void;
}

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  borderRadius: 6,
  background: "var(--tree-panel-bg)",
  border: "1px solid var(--tree-panel-border)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  overflow: "hidden",
};

export function PanControls({ onPan }: PanControlsProps) {
  return (
    <>
      <style>{`
        .pan-controls-panel button:hover {
          background: var(--tree-button-bg) !important;
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          role="group"
          aria-label="Pan up and down"
          className="pan-controls-panel"
          style={panelStyle}
        >
          <button
            type="button"
            onClick={() => onPan(0, PAN_STEP)}
            aria-label="Pan up"
            style={buttonStyle}
          >
            <ChevronUp size={16} strokeWidth={2} />
          </button>
          <div style={{ height: 1, background: "var(--tree-panel-border)", margin: "0 4px" }} />
          <button
            type="button"
            onClick={() => onPan(0, -PAN_STEP)}
            aria-label="Pan down"
            style={buttonStyle}
          >
            <ChevronDown size={16} strokeWidth={2} />
          </button>
        </div>
        <div
          role="group"
          aria-label="Pan left and right"
          className="pan-controls-panel"
          style={panelStyle}
        >
          <button
            type="button"
            onClick={() => onPan(PAN_STEP, 0)}
            aria-label="Pan left"
            style={buttonStyle}
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <div style={{ height: 1, background: "var(--tree-panel-border)", margin: "0 4px" }} />
          <button
            type="button"
            onClick={() => onPan(-PAN_STEP, 0)}
            aria-label="Pan right"
            style={buttonStyle}
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </>
  );
}
