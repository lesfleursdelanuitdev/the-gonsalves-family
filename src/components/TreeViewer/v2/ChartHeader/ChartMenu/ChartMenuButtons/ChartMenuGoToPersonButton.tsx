"use client";

import { UserCircle } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuGoToPersonButtonProps {
  onClick: () => void;
  showLabel?: boolean;
}

/** Mobile: jump-to-person drawer; desktop hidden via menu item `show`. */
export function ChartMenuGoToPersonButton({
  onClick,
  showLabel = true,
}: ChartMenuGoToPersonButtonProps) {
  return (
    <ChartMenuButton
      icon={<UserCircle size={13} />}
      onClick={onClick}
      title="Jump to Person"
      label="Jump to Person"
      showLabel={showLabel}
    />
  );
}
