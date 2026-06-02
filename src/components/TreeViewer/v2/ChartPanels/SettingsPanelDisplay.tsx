"use client";

import type { CSSProperties } from "react";
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
  compactCardWidth: number;
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

// SVG dimensions for card thumbnails
const THUMB_W = 96;
const THUMB_H = 62;

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

/** SVG person-card thumbnail for one {@link PersonCardLayout} option. */
function PersonCardLayoutSkeleton({ layout }: { layout: PersonCardLayout }) {
  const W = THUMB_W;
  const H = THUMB_H;
  const card = COLORS.card;
  const stroke = COLORS.cardStroke;
  const av = COLORS.muted;       // avatar fill
  const bar = COLORS.divider;    // name/date bars
  const act = COLORS.iconStroke; // action icons
  const r = 5;                   // card corner radius

  // Shared action pip: three small rounded rects
  const hPips = (x: number, y: number) => (
    <>
      {[0, 7, 14].map((dx) => (
        <rect key={dx} x={x + dx} y={y} width={5} height={5} rx={1.5} fill={act} opacity={0.55} />
      ))}
    </>
  );
  const vPips = (x: number, y: number) => (
    <>
      {[0, 7, 14].map((dy) => (
        <rect key={dy} x={x} y={y + dy} width={5} height={5} rx={1.5} fill={act} opacity={0.55} />
      ))}
    </>
  );
  const menuChevron = (x: number, y: number) => (
    <>
      {[0, 4, 8].map((dy, i) => (
        <rect key={i} x={x} y={y + dy} width={[10, 8, 6][i]} height={2} rx={1} fill={act} opacity={0.5} />
      ))}
    </>
  );

  const svgProps = {
    width: W, height: H, viewBox: `0 0 ${W} ${H}`,
    style: { display: "block", width: "100%", height: "auto" } as const,
  };

  switch (layout) {
    case "avatarTopActionsBottom":
      return (
        <svg {...svgProps}>
          <rect x={0} y={0} width={W} height={H} rx={r} fill={card} stroke={stroke} strokeWidth={1} />
          <circle cx={W / 2} cy={14} r={8} fill={av} opacity={0.7} />
          <rect x={14} y={27} width={W - 28} height={5} rx={2.5} fill={bar} opacity={0.6} />
          <rect x={22} y={35} width={W - 44} height={4} rx={2} fill={bar} opacity={0.4} />
          {hPips(W / 2 - 9, H - 13)}
        </svg>
      );

    case "avatarLeftActionsRight":
      return (
        <svg {...svgProps}>
          <rect x={0} y={0} width={W} height={H} rx={r} fill={card} stroke={stroke} strokeWidth={1} />
          <circle cx={16} cy={H / 2} r={9} fill={av} opacity={0.7} />
          <rect x={30} y={H / 2 - 9} width={W - 52} height={5} rx={2.5} fill={bar} opacity={0.6} />
          <rect x={30} y={H / 2 - 1} width={(W - 52) * 0.65} height={4} rx={2} fill={bar} opacity={0.4} />
          {vPips(W - 16, H / 2 - 11)}
        </svg>
      );

    case "avatarLeftActionsBottom":
      return (
        <svg {...svgProps}>
          <rect x={0} y={0} width={W} height={H} rx={r} fill={card} stroke={stroke} strokeWidth={1} />
          <circle cx={15} cy={H / 2 - 6} r={9} fill={av} opacity={0.7} />
          <rect x={29} y={H / 2 - 14} width={W - 36} height={5} rx={2.5} fill={bar} opacity={0.6} />
          <rect x={29} y={H / 2 - 6} width={(W - 36) * 0.65} height={4} rx={2} fill={bar} opacity={0.4} />
          {hPips(W / 2 - 9, H - 13)}
        </svg>
      );

    case "avatarTopActionsRight":
      return (
        <svg {...svgProps}>
          <rect x={0} y={0} width={W} height={H} rx={r} fill={card} stroke={stroke} strokeWidth={1} />
          <circle cx={W / 2 - 8} cy={13} r={8} fill={av} opacity={0.7} />
          <rect x={10} y={27} width={W - 30} height={5} rx={2.5} fill={bar} opacity={0.6} />
          <rect x={10} y={35} width={(W - 30) * 0.65} height={4} rx={2} fill={bar} opacity={0.4} />
          {vPips(W - 16, H / 2 - 4)}
        </svg>
      );

    case "avatarTopMobileMenu":
      return (
        <svg {...svgProps}>
          <rect x={0} y={0} width={W} height={H} rx={r} fill={card} stroke={stroke} strokeWidth={1} />
          {/* Three-dot overflow button — top-right corner (mobile portrait) */}
          {[0, 4, 8].map((dy) => (
            <circle key={dy} cx={W - 8} cy={8 + dy} r={1.4} fill={act} opacity={0.5} />
          ))}
          {/* Avatar — large, centered in card (mobile portrait: cy=96/212≈45%, r=36/330≈11%) */}
          <circle cx={W / 2} cy={H / 2 - 4} r={12} fill={av} opacity={0.7} />
          {/* Name bar — centered below avatar */}
          <rect x={16} y={H / 2 + 12} width={W - 32} height={5} rx={2.5} fill={bar} opacity={0.6} />
          {/* Date bar */}
          <rect x={24} y={H / 2 + 20} width={W - 48} height={4} rx={2} fill={bar} opacity={0.4} />
        </svg>
      );

    case "avatarLeftMobileMenu":
      return (
        <svg {...svgProps}>
          <rect x={0} y={0} width={W} height={H} rx={r} fill={card} stroke={stroke} strokeWidth={1} />
          {/* Three-dot overflow button — top-right corner (menuCx=302,menuCy=28 → W-8, 8) */}
          {[0, 4, 8].map((dy) => (
            <circle key={dy} cx={W - 8} cy={8 + dy} r={1.4} fill={act} opacity={0.5} />
          ))}
          {/* Avatar — left side, vertically centered (avatarCx=52,avatarCy=118,r=30 → 15, 34, 9) */}
          <circle cx={15} cy={34} r={9} fill={av} opacity={0.7} />
          {/* Name bar — right of avatar */}
          <rect x={28} y={29} width={W - 42} height={5} rx={2.5} fill={bar} opacity={0.6} />
          {/* Date bar */}
          <rect x={28} y={37} width={(W - 42) * 0.65} height={4} rx={2} fill={bar} opacity={0.4} />
        </svg>
      );

    default:
      return (
        <svg {...svgProps}>
          <rect x={0} y={0} width={W} height={H} rx={r} fill={card} stroke={stroke} strokeWidth={1} />
        </svg>
      );
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
          {/* Card width slider — compact variants only */}
          <div style={{ marginTop: 12 }}>
            <div style={{ color: "var(--tree-text-muted)", fontSize: 12, marginBottom: 6 }}>Card width</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="range"
                min={120}
                max={400}
                step={10}
                value={settings.compactCardWidth}
                aria-label="Card width in pixels"
                onChange={(e) => onUpdateSetting("compactCardWidth", Number(e.target.value))}
                style={{ flex: 1, accentColor: "var(--tree-root, #2f6f4e)" }}
              />
              <span style={{ minWidth: 40, textAlign: "right", fontSize: 11, fontVariantNumeric: "tabular-nums", color: "var(--tree-text-subtle)" }}>
                {settings.compactCardWidth}px
              </span>
            </div>
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
