"use client";

import { Heart } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuToggleAllSpousesButtonProps {
  onClick: () => void;
  showLabel?: boolean;
}

/** Mobile: reveal/collapse all partners in descendancy; desktop hidden via menu item `show`. */
export function ChartMenuToggleAllSpousesButton({
  onClick,
  showLabel = true,
}: ChartMenuToggleAllSpousesButtonProps) {
  return (
    <ChartMenuButton
      icon={<Heart size={13} />}
      onClick={onClick}
      title="Toggle All Partners"
      label="Toggle All Partners"
      showLabel={showLabel}
    />
  );
}
