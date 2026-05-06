"use client";

import { PanelTopClose, PanelTopOpen } from "lucide-react";
import { ChartMenuButton } from "./ChartMenuButton";

export interface ChartMenuHeaderToggleButtonProps {
  headerOpen: boolean;
  onToggle: () => void;
  /** When false (mobile), only the icon is shown. */
  showLabel?: boolean;
}

/** Desktop-only: hide/show header. Icon and label change with state. */
export function ChartMenuHeaderToggleButton({
  headerOpen,
  onToggle,
  showLabel = true,
}: ChartMenuHeaderToggleButtonProps) {
  return (
    <ChartMenuButton
      icon={headerOpen ? <PanelTopClose size={13} /> : <PanelTopOpen size={13} />}
      onClick={onToggle}
      title={headerOpen ? "Hide header" : "Show header"}
      label={headerOpen ? "Hide header" : "Show header"}
      showLabel={showLabel}
    />
  );
}
