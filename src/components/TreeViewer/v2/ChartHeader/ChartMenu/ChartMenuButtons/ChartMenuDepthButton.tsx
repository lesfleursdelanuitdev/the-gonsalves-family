"use client";

import { DepthDropdown } from "../../DepthDropdown";

export interface ChartMenuDepthButtonProps {
  maxDepth: number;
  displayedDepth?: number;
  onMaxDepthChange: (n: number) => void;
  isMobile?: boolean;
}

export function ChartMenuDepthButton({
  maxDepth,
  displayedDepth,
  onMaxDepthChange,
  isMobile = false,
}: ChartMenuDepthButtonProps) {
  if (isMobile) return null;
  return (
    <DepthDropdown
      maxDepth={maxDepth}
      displayedDepth={displayedDepth}
      onMaxDepthChange={onMaxDepthChange}
      variant="toolbar"
      showLabel
    />
  );
}
