"use client";

import { Info } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuInfoButtonProps {
  onClick: () => void;
  active?: boolean;
  showLabel?: boolean;
}

export function ChartMenuInfoButton({
  onClick,
  active = false,
  showLabel = true,
}: ChartMenuInfoButtonProps) {
  return (
    <ChartMenuButton
      icon={<Info size={13} />}
      onClick={onClick}
      title="Dataset info"
      label="Info"
      active={active}
      showLabel={showLabel}
    />
  );
}
