"use client";

import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { ChartViewportRightVerticalMenuItem } from "./ChartViewportRightVerticalMenuItem";

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

const PAN_STEP = 48;

interface PanControlsProps {
  onPan: (dx: number, dy: number) => void;
}

export function PanControls({ onPan }: PanControlsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <ChartViewportRightVerticalMenuItem ariaLabel="Pan up and down">
        <button type="button" onClick={() => onPan(0, PAN_STEP)} aria-label="Pan up" style={buttonStyle}>
          <ChevronUp size={16} strokeWidth={2} />
        </button>
        <div style={{ height: 1, background: "var(--tree-panel-border)", margin: "0 4px" }} />
        <button type="button" onClick={() => onPan(0, -PAN_STEP)} aria-label="Pan down" style={buttonStyle}>
          <ChevronDown size={16} strokeWidth={2} />
        </button>
      </ChartViewportRightVerticalMenuItem>
      <ChartViewportRightVerticalMenuItem ariaLabel="Pan left and right">
        <button type="button" onClick={() => onPan(PAN_STEP, 0)} aria-label="Pan left" style={buttonStyle}>
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <div style={{ height: 1, background: "var(--tree-panel-border)", margin: "0 4px" }} />
        <button type="button" onClick={() => onPan(-PAN_STEP, 0)} aria-label="Pan right" style={buttonStyle}>
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </ChartViewportRightVerticalMenuItem>
    </div>
  );
}
