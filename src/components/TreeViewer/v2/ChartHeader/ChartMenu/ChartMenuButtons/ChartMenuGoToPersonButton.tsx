"use client";

import { UserCircle } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuGoToPersonButtonProps {
  onClick: () => void;
}

/** Mobile-only: go to person. Icon only. */
export function ChartMenuGoToPersonButton({ onClick }: ChartMenuGoToPersonButtonProps) {
  return (
    <ChartMenuButton
      icon={<UserCircle size={13} />}
      onClick={onClick}
      title="Go to person"
      showLabel={false}
    />
  );
}
