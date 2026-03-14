"use client";

import { DepthDropdown } from "../ChartHeader/DepthDropdown";
import { SettingsSection } from "./SettingsSection";

export interface SettingsPanelTreeDepthProps {
  maxDepth: number;
  displayedDepth?: number;
  onMaxDepthChange: (n: number) => void;
}

export function SettingsPanelTreeDepth({
  maxDepth,
  displayedDepth,
  onMaxDepthChange,
}: SettingsPanelTreeDepthProps) {
  return (
    <SettingsSection title="Tree depth">
      <DepthDropdown
        maxDepth={maxDepth}
        displayedDepth={displayedDepth}
        onMaxDepthChange={onMaxDepthChange}
        variant="settings"
        showLabel
      />
    </SettingsSection>
  );
}
