"use client";

import { Network } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuChartButtonProps {
  onClick: () => void;
  /** When the chart-type modal is open (same affordance as History when panel is open). */
  active?: boolean;
  showLabel?: boolean;
}

export function ChartMenuChartButton({
  onClick,
  active = false,
  showLabel = true,
}: ChartMenuChartButtonProps) {
  return (
    <ChartMenuButton
      icon={<Network size={13} />}
      onClick={onClick}
      title="Charts"
      label="Charts"
      active={active}
      showLabel={showLabel}
    />
  );
}
