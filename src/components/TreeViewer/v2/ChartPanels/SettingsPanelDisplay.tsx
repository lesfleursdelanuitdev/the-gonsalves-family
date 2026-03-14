"use client";

import { SettingsSection } from "./SettingsSection";

export interface SettingsPanelDisplaySettings {
  showDates: boolean;
  showPhotos: boolean;
  showUnknown: boolean;
}

export interface SettingsPanelDisplayProps {
  settings: SettingsPanelDisplaySettings;
  onUpdateSetting: <K extends keyof SettingsPanelDisplaySettings>(
    key: K,
    value: SettingsPanelDisplaySettings[K]
  ) => void;
}

const toggleRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};

function ToggleButton({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
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

export function SettingsPanelDisplay({ settings, onUpdateSetting }: SettingsPanelDisplayProps) {
  const items = [
    { label: "Show birth & death years", key: "showDates" as const },
    { label: "Show photos", key: "showPhotos" as const },
    { label: "Show unknown parents", key: "showUnknown" as const },
  ] as const;

  return (
    <SettingsSection title="Display">
      {items.map(({ label, key }) => (
        <div key={key} style={toggleRowStyle}>
          <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>{label}</span>
          <ToggleButton checked={settings[key]} onClick={() => onUpdateSetting(key, !settings[key])} />
        </div>
      ))}
    </SettingsSection>
  );
}
