"use client";

import { Home } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuHomeButtonProps {
  onClick: () => void;
  showLabel?: boolean;
}

export function ChartMenuHomeButton({ onClick, showLabel = true }: ChartMenuHomeButtonProps) {
  return (
    <ChartMenuButton
      icon={<Home size={13} />}
      onClick={onClick}
      title="Go to current root"
      label="Home"
      showLabel={showLabel}
    />
  );
}
