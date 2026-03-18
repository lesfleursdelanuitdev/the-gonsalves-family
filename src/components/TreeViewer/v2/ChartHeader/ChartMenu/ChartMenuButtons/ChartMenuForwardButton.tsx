"use client";

import { ChevronRight } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuForwardButtonProps {
  onClick: () => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export function ChartMenuForwardButton({
  onClick,
  disabled = false,
  showLabel = true,
}: ChartMenuForwardButtonProps) {
  return (
    <ChartMenuButton
      icon={<ChevronRight size={13} />}
      onClick={onClick}
      title="Forward"
      label="Forward"
      showLabel={showLabel}
      disabled={disabled}
    />
  );
}
