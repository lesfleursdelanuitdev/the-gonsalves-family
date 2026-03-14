"use client";

import { ChartPanel } from "./ChartPanel";
import { SettingsPanelDisplay } from "./SettingsPanelDisplay";
import { SettingsSection } from "./SettingsSection";
import { SettingsPanelTreeDepth } from "./SettingsPanelTreeDepth";

/** v2 settings: no defaultRootId. */
export interface ChartSettingsV2 {
  showDates: boolean;
  showPhotos: boolean;
  showUnknown: boolean;
  autoLegendModal: boolean;
}

export interface SettingsPanelProps {
  settings: ChartSettingsV2;
  onUpdateSetting: <K extends keyof ChartSettingsV2>(key: K, value: ChartSettingsV2[K]) => void;
  onClose: () => void;
  isMobile?: boolean;
  maxDepth: number;
  displayedDepth?: number;
  onMaxDepthChange: (n: number) => void;
}

const toggleRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};

function ToggleButton({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        cursor: "pointer",
        flexShrink: 0,
        background: checked ? "var(--tree-root)" : "var(--tree-border)",
        border: `1px solid ${checked ? "var(--tree-root)" : "var(--tree-button-border)"}`,
        position: "relative",
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 17 : 2,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: checked ? "var(--surface-elevated)" : "var(--tree-text-subtle)",
          transition: "left 0.2s, background 0.2s",
        }}
      />
    </button>
  );
}

export function SettingsPanel({
  settings,
  onUpdateSetting,
  onClose,
  isMobile,
  maxDepth,
  displayedDepth,
  onMaxDepthChange,
}: SettingsPanelProps) {
  return (
    <ChartPanel
      title="Settings"
      onClose={onClose}
      placement={{ top: 108, right: 16 }}
      isMobile={isMobile}
      minWidth={280}
      closeButtonStyle={{ marginTop: 4 }}
    >
      <SettingsPanelTreeDepth
        maxDepth={maxDepth}
        displayedDepth={displayedDepth}
        onMaxDepthChange={onMaxDepthChange}
      />
      <SettingsPanelDisplay settings={settings} onUpdateSetting={onUpdateSetting} />
      <SettingsSection title="Behaviour">
        <div style={toggleRowStyle}>
          <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>
            Auto-show legend on siblings
          </span>
          <ToggleButton
            checked={settings.autoLegendModal}
            onClick={() => onUpdateSetting("autoLegendModal", !settings.autoLegendModal)}
          />
        </div>
      </SettingsSection>
    </ChartPanel>
  );
}
