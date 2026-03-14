"use client";

import { Settings } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuSettingsButtonProps {
  onClick: () => void;
  active?: boolean;
  showLabel?: boolean;
}

export function ChartMenuSettingsButton({
  onClick,
  active = false,
  showLabel = true,
}: ChartMenuSettingsButtonProps) {
  return (
    <ChartMenuButton
      icon={<Settings size={13} />}
      onClick={onClick}
      title="Settings"
      label="Settings"
      active={active}
      showLabel={showLabel}
    />
  );
}
