"use client";

import { useState } from "react";
import { ChartPanel } from "./ChartPanel";
import { SettingsPanelDisplay } from "./SettingsPanelDisplay";
import { SettingsPanelViewOptions } from "./SettingsPanelViewOptions";
import { SettingsSection } from "./SettingsSection";
import { SettingsPanelTreeDepth } from "./SettingsPanelTreeDepth";

import type {
  PersonCardLayout,
  PersonCardVariant,
  PersonCompactCardSize,
} from "@/lib/person-card-layout";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";

/** v2 settings: no defaultRootId. */
export interface ChartSettingsV2 {
  showDates: boolean;
  showPhotos: boolean;
  showUnknown: boolean;
  /** Bottom row (heart, root, expand, etc.) on person cards; pedigree & vertical pedigree use the same cards. */
  showCardActionIcons: boolean;
  /** Desktop: overview minimap (hidden on mobile regardless). */
  showMinimap: boolean;
  autoLegendModal: boolean;
  /** Person card visual style across desktop/mobile (mobile auto-falls back to menu variants). */
  personCardLayout: PersonCardLayout;
  /** `full` = existing rich cards; compact variants for dense trees (see CompactPersonCard). */
  personCardVariant: PersonCardVariant;
  /** Row height when `personCardVariant` is compact. */
  compactCardSize: PersonCompactCardSize;
  /**
   * Horizontal pedigree: vertical gap (px) between stacked parent cards (first parent bottom → second parent top).
   */
  parentPairGap: number;
  /** Fan chart: radius (px) for the center/root circle. */
  fanRootRadius: number;
}

export interface SettingsPanelProps {
  settings: ChartSettingsV2;
  onUpdateSetting: <K extends keyof ChartSettingsV2>(key: K, value: ChartSettingsV2[K]) => void;
  onClose: () => void;
  isMobile?: boolean;
  maxDepth: number;
  displayedDepth?: number;
  onMaxDepthChange: (n: number) => void;
  chartStrategy: ChartViewStrategyName;
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
  chartStrategy,
}: SettingsPanelProps) {
  const [settingsTab, setSettingsTab] = useState<"display" | "view">("display");

  const tabBtn = (id: "display" | "view", label: string) => {
    const active = settingsTab === id;
    return (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => setSettingsTab(id)}
        style={{
          flex: 1,
          padding: "8px 6px",
          borderRadius: 8,
          border: active ? "2px solid var(--tree-root, #2f6f4e)" : "1px solid var(--tree-button-border)",
          background: active ? "var(--hover-overlay)" : "var(--surface-elevated)",
          color: "var(--tree-text)",
          fontSize: 11,
          fontWeight: active ? 600 : 500,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <ChartPanel
      title="Settings"
      onClose={onClose}
      drawer
      drawerWidth={420}
      isMobile={isMobile}
      showCloseButton={false}
    >
      <SettingsPanelTreeDepth
        maxDepth={maxDepth}
        displayedDepth={displayedDepth}
        onMaxDepthChange={onMaxDepthChange}
      />
      <div
        role="tablist"
        aria-label="Settings sections"
        style={{ display: "flex", gap: 8, marginBottom: 12, flexShrink: 0 }}
      >
        {tabBtn("display", "Display")}
        {tabBtn("view", "View options")}
      </div>
      {settingsTab === "display" ? (
        <SettingsPanelDisplay
          settings={settings}
          onUpdateSetting={(key, value) => onUpdateSetting(key, value as ChartSettingsV2[typeof key])}
        />
      ) : (
        <SettingsPanelViewOptions
          chartStrategy={chartStrategy}
          settings={settings}
          onUpdateSetting={(key, value) => onUpdateSetting(key, value as ChartSettingsV2[typeof key])}
        />
      )}
      <SettingsSection title="Behaviour">
        <div style={toggleRowStyle}>
          <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>
            Auto-show legend for Parents & Siblings View
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
