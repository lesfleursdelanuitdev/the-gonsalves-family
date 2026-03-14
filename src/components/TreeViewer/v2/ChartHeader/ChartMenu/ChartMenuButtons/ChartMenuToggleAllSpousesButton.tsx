"use client";

import { Heart } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuToggleAllSpousesButtonProps {
  onClick: () => void;
}

/** Mobile-only: toggle all partners. Icon only. */
export function ChartMenuToggleAllSpousesButton({ onClick }: ChartMenuToggleAllSpousesButtonProps) {
  return (
    <ChartMenuButton
      icon={<Heart size={13} />}
      onClick={onClick}
      title="Toggle all partners"
      showLabel={false}
    />
  );
}
