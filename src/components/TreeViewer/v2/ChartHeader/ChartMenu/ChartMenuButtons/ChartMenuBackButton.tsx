"use client";

import { ChevronLeft } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuBackButtonProps {
  onClick: () => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export function ChartMenuBackButton({
  onClick,
  disabled = false,
  showLabel = true,
}: ChartMenuBackButtonProps) {
  return (
    <ChartMenuButton
      icon={<ChevronLeft size={13} />}
      onClick={onClick}
      title="Back"
      label="Back"
      showLabel={showLabel}
      disabled={disabled}
    />
  );
}

