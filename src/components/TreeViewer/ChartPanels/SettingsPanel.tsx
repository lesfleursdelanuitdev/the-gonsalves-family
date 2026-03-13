"use client";

import { getPeople, DEFAULT_MAX_DEPTH } from "@/descendancy-chart";
import { PanelCloseButton } from "./PanelCloseButton";

const DEPTH_OPTIONS = Array.from({ length: DEFAULT_MAX_DEPTH }, (_, i) => i + 1);

export interface ChartSettings {
  showDates: boolean;
  showPhotos: boolean;
  showUnknown: boolean;
  autoLegendModal: boolean;
  defaultRootId: string;
}

interface SettingsPanelProps {
  settings: ChartSettings;
  onUpdateSetting: <K extends keyof ChartSettings>(key: K, value: ChartSettings[K]) => void;
  onClose: () => void;
  isMobile?: boolean;
  maxDepth: number;
  displayedDepth?: number;
  onMaxDepthChange: (n: number) => void;
}

export function SettingsPanel({ settings, onUpdateSetting, onClose, isMobile, maxDepth, displayedDepth, onMaxDepthChange }: SettingsPanelProps) {
  const currentDepth = Math.max(1, Math.min(displayedDepth ?? maxDepth, DEFAULT_MAX_DEPTH));
  return (
    <div
      style={
        isMobile
          ? {
              background: "var(--tree-panel-bg)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--tree-border)",
              borderRadius: 10,
              padding: "16px 20px",
              minWidth: 280,
              maxHeight: "100%",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              fontFamily: "system-ui, sans-serif",
            }
          : {
              position: "fixed",
              top: 108,
              right: 16,
              background: "var(--tree-panel-bg)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--tree-border)",
              borderRadius: 10,
              padding: "16px 20px",
              zIndex: 300,
              minWidth: 280,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              fontFamily: "system-ui, sans-serif",
            }
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            color: "var(--tree-text-subtle)",
            fontSize: 9,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Tree depth
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>Generations to show</span>
          <select
            aria-label="Generations to show"
            value={currentDepth}
            onChange={(e) => onMaxDepthChange(Number(e.target.value))}
            style={{
              fontSize: 12,
              padding: "6px 28px 6px 10px",
              borderRadius: 6,
              border: "1px solid var(--tree-border)",
              background: "var(--tree-panel-bg)",
              color: "var(--tree-text)",
              cursor: "pointer",
              flex: 1,
              maxWidth: 120,
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5b4f' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {DEPTH_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "generation" : "generations"}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            color: "var(--tree-text-subtle)",
            fontSize: 9,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Display
        </div>
        {(
          [
            { label: "Show birth & death years", key: "showDates" as const },
            { label: "Show photos", key: "showPhotos" as const },
            { label: "Show unknown parents", key: "showUnknown" as const },
          ] as const
        ).map(({ label, key }) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>{label}</span>
            <button
              type="button"
              onClick={() => onUpdateSetting(key, !settings[key])}
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                cursor: "pointer",
                flexShrink: 0,
                background: settings[key] ? "var(--tree-root)" : "var(--tree-border)",
                border: `1px solid ${settings[key] ? "var(--tree-root)" : "var(--tree-button-border)"}`,
                position: "relative",
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: settings[key] ? 17 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: settings[key] ? "var(--surface-elevated)" : "var(--tree-text-subtle)",
                  transition: "left 0.2s, background 0.2s",
                }}
              />
            </button>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            color: "var(--tree-text-subtle)",
            fontSize: 9,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Behaviour
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>Auto-show legend on siblings</span>
          <button
            type="button"
            onClick={() => onUpdateSetting("autoLegendModal", !settings.autoLegendModal)}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              cursor: "pointer",
              flexShrink: 0,
              background: settings.autoLegendModal ? "var(--tree-root)" : "var(--tree-border)",
              border: `1px solid ${settings.autoLegendModal ? "var(--tree-root)" : "var(--tree-button-border)"}`,
              position: "relative",
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 2,
                left: settings.autoLegendModal ? 17 : 2,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: settings.autoLegendModal ? "var(--surface-elevated)" : "var(--tree-text-subtle)",
                transition: "left 0.2s, background 0.2s",
              }}
            />
          </button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>Default root</span>
          <select
            value={settings.defaultRootId}
            onChange={(e) => onUpdateSetting("defaultRootId", e.target.value)}
            style={{
              background: "var(--tree-panel-bg)",
              border: "1px solid var(--tree-button-border)",
              borderRadius: 5,
              color: "var(--tree-text)",
              fontSize: 11,
              padding: "3px 6px",
              cursor: "pointer",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {Array.from(getPeople().values())
              .filter((p) => !p.id.startsWith("unknown"))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
          </select>
        </div>
      </div>
      <PanelCloseButton onClick={onClose} style={{ marginTop: 16 }} />
    </div>
  );
}
