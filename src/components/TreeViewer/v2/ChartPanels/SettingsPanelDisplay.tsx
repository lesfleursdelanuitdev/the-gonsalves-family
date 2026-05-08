"use client";

import type { CSSProperties, ReactNode } from "react";
import { SettingsSection } from "./SettingsSection";
import {
  COLORS,
  PERSON_CARD_LAYOUT_OPTIONS,
  type PersonCardLayout,
  type PersonCardVariant,
  type PersonCompactCardSize,
} from "@/lib/person-card-layout";

export interface SettingsPanelDisplaySettings {
  showDates: boolean;
  showPhotos: boolean;
  showUnknown: boolean;
  showCardActionIcons: boolean;
  showMinimap: boolean;
  personCardLayout: PersonCardLayout;
  personCardVariant: PersonCardVariant;
  compactCardSize: PersonCompactCardSize;
}

const COMPACT_STYLE_OPTIONS: { value: PersonCardVariant; label: string; hint: string }[] = [
  { value: "compact-name", label: "Name only", hint: "Dense — name and optional menu chevron" },
  { value: "compact-avatar", label: "Name + tiny avatar", hint: "Small photo, name, optional chevron" },
];

const COMPACT_SIZE_OPTIONS: { value: PersonCompactCardSize; label: string }[] = [
  { value: "large", label: "Large" },
  { value: "medium", label: "Medium" },
  { value: "small", label: "Small" },
  { value: "extra-small", label: "Extra small" },
];

export interface SettingsPanelDisplayProps {
  settings: SettingsPanelDisplaySettings;
  onUpdateSetting: <K extends keyof SettingsPanelDisplaySettings>(
    key: K,
    value: SettingsPanelDisplaySettings[K]
  ) => void;
}

const toggleRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};

const SKETCH_INNER: CSSProperties = {
  height: 76,
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 8,
  border: `1px solid ${COLORS.cardStroke}`,
  background: COLORS.card,
  padding: 5,
  display: "flex",
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

function dot(): CSSProperties {
  return {
    width: 11,
    height: 11,
    borderRadius: "50%",
    background: COLORS.muted,
    flexShrink: 0,
  };
}

function bar(widthPct: string): CSSProperties {
  return {
    height: 3,
    borderRadius: 2,
    background: COLORS.divider,
    width: widthPct,
    maxWidth: "100%",
  };
}

function actionPip(): CSSProperties {
  return {
    width: 5,
    height: 5,
    borderRadius: 1,
    background: COLORS.iconStroke,
    flexShrink: 0,
  };
}

function menuLines(): ReactNode {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
      {[10, 8, 6].map((w, i) => (
        <div
          key={i}
          style={{
            height: 2,
            width: w,
            borderRadius: 1,
            background: COLORS.iconStroke,
          }}
        />
      ))}
    </div>
  );
}

/** Wireframe thumbnail for one {@link PersonCardLayout} option. */
function PersonCardLayoutSkeleton({ layout }: { layout: PersonCardLayout }) {
  switch (layout) {
    case "avatarTopActionsBottom":
      return (
        <div
          style={{
            ...SKETCH_INNER,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 4,
          }}
        >
          <div style={dot()} />
          <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center", width: "100%" }}>
            <div style={bar("78%")} />
            <div style={bar("52%")} />
          </div>
          <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
            <div style={actionPip()} />
            <div style={actionPip()} />
            <div style={actionPip()} />
          </div>
        </div>
      );
    case "avatarLeftActionsRight":
      return (
        <div style={{ ...SKETCH_INNER, flexDirection: "row", alignItems: "stretch", gap: 5 }}>
          <div style={{ ...dot(), alignSelf: "center" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, justifyContent: "center" }}>
            <div style={bar("100%")} />
            <div style={bar("70%")} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center" }}>
            <div style={actionPip()} />
            <div style={actionPip()} />
            <div style={actionPip()} />
          </div>
        </div>
      );
    case "avatarLeftActionsBottom":
      return (
        <div style={{ ...SKETCH_INNER, flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", flexDirection: "row", gap: 5, alignItems: "center" }}>
            <div style={dot()} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={bar("100%")} />
              <div style={bar("65%")} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
            <div style={actionPip()} />
            <div style={actionPip()} />
            <div style={actionPip()} />
          </div>
        </div>
      );
    case "avatarTopActionsRight":
      return (
        <div style={{ ...SKETCH_INNER, flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={dot()} />
          </div>
          <div style={{ display: "flex", flexDirection: "row", gap: 5, flex: 1, alignItems: "stretch" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, justifyContent: "center" }}>
              <div style={bar("100%")} />
              <div style={bar("58%")} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center" }}>
              <div style={actionPip()} />
              <div style={actionPip()} />
              <div style={actionPip()} />
            </div>
          </div>
        </div>
      );
    case "avatarTopMobileMenu":
      return (
        <div
          style={{
            ...SKETCH_INNER,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 4,
          }}
        >
          <div style={dot()} />
          <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center", width: "100%" }}>
            <div style={bar("80%")} />
            <div style={bar("50%")} />
          </div>
          <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>{menuLines()}</div>
        </div>
      );
    case "avatarLeftMobileMenu":
      return (
        <div style={{ ...SKETCH_INNER, flexDirection: "row", alignItems: "center", gap: 5 }}>
          <div style={dot()} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={bar("100%")} />
            <div style={bar("62%")} />
          </div>
          {menuLines()}
        </div>
      );
    default:
      return <div style={SKETCH_INNER} />;
  }
}

export function SettingsPanelDisplay({ settings, onUpdateSetting }: SettingsPanelDisplayProps) {
  const items = [
    { label: "Show unknown parents", key: "showUnknown" as const },
    { label: "Show minimap", key: "showMinimap" as const },
  ] as const;

  const isFull = settings.personCardVariant === "full";

  const primaryChoiceStyle = (selected: boolean): CSSProperties => ({
    textAlign: "left",
    padding: "8px 10px",
    borderRadius: 8,
    border: selected ? `2px solid ${COLORS.selectedStroke}` : "1px solid var(--tree-button-border)",
    background: selected ? "var(--hover-overlay)" : "var(--surface-elevated)",
    cursor: "pointer",
    fontFamily: "inherit",
  });

  return (
    <SettingsSection title="Display">
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: "var(--tree-text-muted)", fontSize: 12, marginBottom: 6 }}>Card appearance</div>
        <div
          role="radiogroup"
          aria-label="Full or compact person cards"
          style={{ display: "flex", flexDirection: "column", gap: 6 }}
        >
          <button
            type="button"
            role="radio"
            aria-checked={isFull}
            onClick={() => onUpdateSetting("personCardVariant", "full")}
            style={primaryChoiceStyle(isFull)}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tree-text)" }}>Full card</div>
            <div style={{ fontSize: 10, color: "var(--tree-text-subtle)", marginTop: 2 }}>
              Rich cards — dates, photos, actions; pick a layout below
            </div>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!isFull}
            onClick={() => {
              if (isFull) {
                onUpdateSetting("personCardVariant", "compact-name");
              }
            }}
            style={primaryChoiceStyle(!isFull)}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tree-text)" }}>Compact</div>
            <div style={{ fontSize: 10, color: "var(--tree-text-subtle)", marginTop: 2 }}>
              Dense tree — name only or tiny avatar; options below
            </div>
          </button>
        </div>
      </div>

      {isFull ? (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "block",
              color: "var(--tree-text-muted)",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            Rich card layout ({PERSON_CARD_LAYOUT_OPTIONS.length})
          </div>
          <div
            role="radiogroup"
            aria-label="Person card style"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              maxHeight: 220,
              overflowY: "auto",
              padding: "2px 4px 6px",
              marginBottom: 6,
              borderRadius: 10,
              border: "1px solid var(--tree-button-border)",
              background: "rgba(0,0,0,0.02)",
            }}
          >
            {PERSON_CARD_LAYOUT_OPTIONS.map((option) => {
              const selected = settings.personCardLayout === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={option.label}
                  onClick={() => onUpdateSetting("personCardLayout", option.value)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    padding: 6,
                    borderRadius: 10,
                    cursor: "pointer",
                    border: selected
                      ? `2px solid ${COLORS.selectedStroke}`
                      : "1px solid var(--tree-button-border)",
                    background: selected ? "var(--hover-overlay)" : "var(--surface-elevated)",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                >
                  <PersonCardLayoutSkeleton layout={option.value} />
                  <span
                    style={{
                      fontSize: 10,
                      marginTop: 5,
                      color: "var(--tree-text-muted)",
                      lineHeight: 1.25,
                      textAlign: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                    title={option.label}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ color: "var(--tree-text-subtle)", fontSize: 11, marginTop: 2 }}>
            On mobile, only menu-based card styles are used to keep the chart readable.
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: "var(--tree-text-muted)", fontSize: 12, marginBottom: 6 }}>Compact style</div>
          <div
            role="radiogroup"
            aria-label="Compact card style"
            style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}
          >
            {COMPACT_STYLE_OPTIONS.map((opt) => {
              const sel = settings.personCardVariant === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => onUpdateSetting("personCardVariant", opt.value)}
                  style={primaryChoiceStyle(sel)}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tree-text)" }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: "var(--tree-text-subtle)", marginTop: 2 }}>{opt.hint}</div>
                </button>
              );
            })}
          </div>
          <div style={{ color: "var(--tree-text-muted)", fontSize: 12, marginBottom: 6 }}>Compact row height</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {COMPACT_SIZE_OPTIONS.map((opt) => {
              const sel = settings.compactCardSize === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  aria-label={opt.label}
                  onClick={() => onUpdateSetting("compactCardSize", opt.value)}
                  style={{
                    padding: "6px 0",
                    borderRadius: 8,
                    fontSize: 11,
                    border: sel ? `2px solid ${COLORS.selectedStroke}` : "1px solid var(--tree-button-border)",
                    background: sel ? "var(--hover-overlay)" : "var(--surface-elevated)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: "var(--tree-text)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {items.map(({ label, key }) => (
        <div key={key} style={toggleRowStyle}>
          <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>{label}</span>
          <ToggleButton checked={settings[key]} onClick={() => onUpdateSetting(key, !settings[key])} />
        </div>
      ))}
    </SettingsSection>
  );
}
