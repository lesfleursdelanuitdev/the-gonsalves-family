"use client";

import { History } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuHistoryButtonProps {
  onClick: () => void;
  active?: boolean;
  showLabel?: boolean;
}

export function ChartMenuHistoryButton({
  onClick,
  active = false,
  showLabel = true,
}: ChartMenuHistoryButtonProps) {
  return (
    <ChartMenuButton
      icon={<History size={13} />}
      onClick={onClick}
      title="Navigation history"
      label="History"
      active={active}
      showLabel={showLabel}
    />
  );
}
