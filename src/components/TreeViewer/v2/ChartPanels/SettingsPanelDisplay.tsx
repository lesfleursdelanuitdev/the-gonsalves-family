"use client";

import { SettingsSection } from "./SettingsSection";
import {
  PERSON_CARD_LAYOUT_OPTIONS,
  type PersonCardLayout,
} from "@/lib/person-card-layout";

export interface SettingsPanelDisplaySettings {
  showDates: boolean;
  showPhotos: boolean;
  showUnknown: boolean;
  showCardActionIcons: boolean;
  showMinimap: boolean;
  personCardLayout: PersonCardLayout;
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
    { label: "Show card action icons", key: "showCardActionIcons" as const },
    { label: "Show minimap", key: "showMinimap" as const },
  ] as const;

  return (
    <SettingsSection title="Display">
      <div style={{ marginBottom: 12 }}>
        <label
          htmlFor="person-card-style"
          style={{ display: "block", color: "var(--tree-text-muted)", fontSize: 12, marginBottom: 6 }}
        >
          Person card style
        </label>
        <select
          id="person-card-style"
          value={settings.personCardLayout}
          onChange={(e) => onUpdateSetting("personCardLayout", e.target.value as PersonCardLayout)}
          style={{
            width: "100%",
            borderRadius: 8,
            border: "1px solid var(--tree-button-border)",
            background: "var(--surface-elevated)",
            color: "var(--tree-text)",
            padding: "8px 10px",
            fontSize: 12,
          }}
        >
          {PERSON_CARD_LAYOUT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div style={{ color: "var(--tree-text-subtle)", fontSize: 11, marginTop: 6 }}>
          On mobile, only menu-based card styles are used to keep the chart readable.
        </div>
      </div>
      {items.map(({ label, key }) => (
        <div key={key} style={toggleRowStyle}>
          <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>{label}</span>
          <ToggleButton checked={settings[key]} onClick={() => onUpdateSetting(key, !settings[key])} />
        </div>
      ))}
    </SettingsSection>
  );
}
