"use client";

import { SettingsSection } from "./SettingsSection";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import {
  DEFAULT_PEDIGREE_PARENT_PAIR_GAP,
  DEFAULT_PEDIGREE_GENERATION_GAP,
  FAN_CHART_DEFAULTS,
} from "@/genealogy-visualization-engine";
import type { ChartSettingsV2 } from "./SettingsPanel";
import { isFanChartStrategy } from "../chartStrategy";

const PARENT_PAIR_GAP_MIN = 4;
const PARENT_PAIR_GAP_MAX = 64;
const PARENT_PAIR_GAP_STEP = 2;
const CX_WIDTH_MIN = 0;
const CX_WIDTH_MAX = 300;
const CX_WIDTH_STEP = 4;
const FAN_ROOT_RADIUS_DEFAULT = FAN_CHART_DEFAULTS.rootRadius;
const FAN_ROOT_RADIUS_MIN = 56;
const FAN_ROOT_RADIUS_MAX = 180;
const FAN_ROOT_RADIUS_STEP = 4;

export interface SettingsPanelViewOptionsProps {
  chartStrategy: ChartViewStrategyName;
  settings: ChartSettingsV2;
  onUpdateSetting: <K extends keyof ChartSettingsV2>(key: K, value: ChartSettingsV2[K]) => void;
}

function clampParentPairGap(px: number): number {
  const n = Math.round(px / PARENT_PAIR_GAP_STEP) * PARENT_PAIR_GAP_STEP;
  return Math.min(PARENT_PAIR_GAP_MAX, Math.max(PARENT_PAIR_GAP_MIN, n));
}

function clampCxWidth(px: number): number {
  const n = Math.round(px / CX_WIDTH_STEP) * CX_WIDTH_STEP;
  return Math.min(CX_WIDTH_MAX, Math.max(CX_WIDTH_MIN, n));
}

function clampFanRootRadius(px: number): number {
  const n = Math.round(px / FAN_ROOT_RADIUS_STEP) * FAN_ROOT_RADIUS_STEP;
  return Math.min(FAN_ROOT_RADIUS_MAX, Math.max(FAN_ROOT_RADIUS_MIN, n));
}

/** Live mini pedigree diagram previewing how spacing settings affect the layout. */
function PedigreeSpacingPreview({ gap, cxWidth }: { gap: number; cxWidth: number }) {
  const W = 220;
  const H = 110;

  // Card dimensions (scaled down for preview)
  const cw = 56;
  const ch = 30;
  const r = 5;

  // Scale the user settings into preview space
  // cx goes 0–300 → map to 0–60 preview px; gap 4–64 → 4–28 px
  const cxPx = Math.round((cxWidth / 300) * 60);
  const gapPx = Math.max(4, Math.round((gap / 64) * 24));

  // Positions: child card on the left, two parents stacked on the right
  const childX = 12;
  const childY = H / 2 - ch / 2;

  const parentX = childX + cw / 2 + cxPx + cw / 2;
  const parentMidY = H / 2;
  const fatherY = parentMidY - gapPx / 2 - ch;
  const motherY = parentMidY + gapPx / 2;

  const connStroke = "var(--tree-root, #2f6f4e)";
  const cardFill = "var(--surface-elevated)";
  const cardStroke = "var(--tree-border, #d4cfc7)";
  const textFill = "var(--tree-text-muted, #9b9488)";
  const barFill = "var(--tree-text-subtle, #bdb8b0)";

  const exitX = childX + cw;
  const fatherCY = fatherY + ch / 2;
  const motherCY = motherY + ch / 2;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", width: "100%", height: "auto", borderRadius: 8, background: "var(--surface-2, rgba(0,0,0,0.02))", border: "1px solid var(--tree-button-border)" }}
    >
      {/* Connectors */}
      <polyline
        points={`${exitX},${childY + ch / 2} ${exitX},${fatherCY} ${parentX},${fatherCY}`}
        fill="none" stroke={connStroke} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.7}
      />
      <polyline
        points={`${exitX},${childY + ch / 2} ${exitX},${motherCY} ${parentX},${motherCY}`}
        fill="none" stroke={connStroke} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.7}
      />

      {/* Child card */}
      <rect x={childX} y={childY} width={cw} height={ch} rx={r} fill={cardFill} stroke={cardStroke} strokeWidth={1} />
      <circle cx={childX + 10} cy={childY + ch / 2} r={5} fill={barFill} opacity={0.6} />
      <rect x={childX + 18} y={childY + 8} width={cw - 22} height={4} rx={2} fill={barFill} opacity={0.5} />
      <rect x={childX + 18} y={childY + 16} width={(cw - 22) * 0.65} height={3} rx={1.5} fill={barFill} opacity={0.35} />

      {/* Father card */}
      <rect x={parentX} y={fatherY} width={cw} height={ch} rx={r} fill={cardFill} stroke={cardStroke} strokeWidth={1} />
      <circle cx={parentX + 10} cy={fatherY + ch / 2} r={5} fill={barFill} opacity={0.6} />
      <rect x={parentX + 18} y={fatherY + 8} width={cw - 22} height={4} rx={2} fill={barFill} opacity={0.5} />
      <rect x={parentX + 18} y={fatherY + 16} width={(cw - 22) * 0.55} height={3} rx={1.5} fill={barFill} opacity={0.35} />

      {/* Mother card */}
      <rect x={parentX} y={motherY} width={cw} height={ch} rx={r} fill={cardFill} stroke={cardStroke} strokeWidth={1} />
      <circle cx={parentX + 10} cy={motherY + ch / 2} r={5} fill={barFill} opacity={0.6} />
      <rect x={parentX + 18} y={motherY + 8} width={cw - 22} height={4} rx={2} fill={barFill} opacity={0.5} />
      <rect x={parentX + 18} y={motherY + 16} width={(cw - 22) * 0.7} height={3} rx={1.5} fill={barFill} opacity={0.35} />

      {/* Labels */}
      <text x={childX + cw / 2} y={H - 4} textAnchor="middle" fontSize={7.5} fill={textFill} fontFamily="inherit">You</text>
      <text x={parentX + cw / 2} y={fatherY - 3} textAnchor="middle" fontSize={7.5} fill={textFill} fontFamily="inherit">Parents</text>
    </svg>
  );
}

const labelStyle = { color: "var(--tree-text)", fontSize: 13, fontWeight: 600, marginBottom: 2 } as const;
const descStyle = { color: "var(--tree-text-subtle)", fontSize: 11, lineHeight: 1.45, margin: "0 0 10px" } as const;
const resetBtnStyle = {
  padding: "5px 10px",
  fontSize: 11,
  borderRadius: 7,
  border: "1px solid var(--tree-button-border)",
  background: "var(--surface-elevated)",
  color: "var(--tree-text-muted)",
  cursor: "pointer",
  fontFamily: "inherit",
} as const;
const sliderValueStyle = {
  minWidth: 36,
  textAlign: "right" as const,
  fontSize: 11,
  fontVariantNumeric: "tabular-nums",
  color: "var(--tree-text-subtle)",
} as const;

export function SettingsPanelViewOptions({
  chartStrategy,
  settings,
  onUpdateSetting,
}: SettingsPanelViewOptionsProps) {
  const showPedigreePairSpacing = chartStrategy === "pedigree";
  const showPedigreeCxWidth = chartStrategy === "pedigree";
  const showPedigreeConnectorStyle = chartStrategy === "pedigree" || chartStrategy === "vertical_pedigree";
  const showFanRootRadius = isFanChartStrategy(chartStrategy);

  if (!showPedigreePairSpacing && !showPedigreeCxWidth && !showPedigreeConnectorStyle && !showFanRootRadius) {
    return (
      <SettingsSection title="Layout">
        <p style={{ color: "var(--tree-text-muted)", fontSize: 13, margin: 0 }}>None</p>
      </SettingsSection>
    );
  }

  const gap = clampParentPairGap(
    Number.isFinite(settings.parentPairGap) ? settings.parentPairGap : DEFAULT_PEDIGREE_PARENT_PAIR_GAP
  );
  const cxWidth = clampCxWidth(
    Number.isFinite(settings.pedigreeConnectorCxWidth) ? settings.pedigreeConnectorCxWidth : DEFAULT_PEDIGREE_GENERATION_GAP
  );
  const fanRootRadius = clampFanRootRadius(
    Number.isFinite(settings.fanRootRadius) ? settings.fanRootRadius : FAN_ROOT_RADIUS_DEFAULT
  );
  const connectorStyle = settings.pedigreeConnectorStyle ?? "classic";

  return (
    <SettingsSection title="Layout">

      {/* Live preview */}
      {(showPedigreePairSpacing || showPedigreeCxWidth) ? (
        <div style={{ marginBottom: 16 }}>
          <PedigreeSpacingPreview gap={gap} cxWidth={cxWidth} />
        </div>
      ) : null}

      {showPedigreeCxWidth ? (
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Generation spacing</div>
          <p style={descStyle}>
            How far apart parent cards sit horizontally from their child. Set to zero for the most compact chart.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <input
              type="range"
              min={CX_WIDTH_MIN}
              max={CX_WIDTH_MAX}
              step={CX_WIDTH_STEP}
              value={cxWidth}
              aria-valuemin={CX_WIDTH_MIN}
              aria-valuemax={CX_WIDTH_MAX}
              aria-valuenow={cxWidth}
              aria-label="Generation spacing"
              onChange={(e) => onUpdateSetting("pedigreeConnectorCxWidth", clampCxWidth(Number(e.target.value)))}
              style={{ flex: 1, accentColor: "var(--tree-root, #2f6f4e)" }}
            />
            <span style={sliderValueStyle}>{cxWidth}px</span>
          </div>
          <button type="button" onClick={() => onUpdateSetting("pedigreeConnectorCxWidth", DEFAULT_PEDIGREE_GENERATION_GAP)} style={resetBtnStyle}>
            Reset
          </button>
        </div>
      ) : null}

      {showPedigreePairSpacing ? (
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Space between parents</div>
          <p style={descStyle}>
            Vertical breathing room between a person's father and mother cards.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <input
              type="range"
              min={PARENT_PAIR_GAP_MIN}
              max={PARENT_PAIR_GAP_MAX}
              step={PARENT_PAIR_GAP_STEP}
              value={gap}
              aria-valuemin={PARENT_PAIR_GAP_MIN}
              aria-valuemax={PARENT_PAIR_GAP_MAX}
              aria-valuenow={gap}
              aria-label="Space between parents"
              onChange={(e) => onUpdateSetting("parentPairGap", clampParentPairGap(Number(e.target.value)))}
              style={{ flex: 1, accentColor: "var(--tree-root, #2f6f4e)" }}
            />
            <span style={sliderValueStyle}>{gap}px</span>
          </div>
          <button type="button" onClick={() => onUpdateSetting("parentPairGap", DEFAULT_PEDIGREE_PARENT_PAIR_GAP)} style={resetBtnStyle}>
            Reset
          </button>
        </div>
      ) : null}

      {showPedigreeConnectorStyle ? (
        <div style={{ marginBottom: 4 }}>
          <div style={labelStyle}>Connector style</div>
          <p style={descStyle}>
            How the lines connecting family members are routed.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {(["classic", "midline"] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => onUpdateSetting("pedigreeConnectorStyle", style)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontSize: 11,
                  borderRadius: 8,
                  border: connectorStyle === style
                    ? "2px solid var(--tree-root, #2f6f4e)"
                    : "1px solid var(--tree-button-border)",
                  background: connectorStyle === style ? "var(--hover-overlay)" : "var(--surface-elevated)",
                  color: "var(--tree-text)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: connectorStyle === style ? 600 : 500,
                  textTransform: "capitalize",
                }}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showFanRootRadius ? (
        <div style={{ marginBottom: 4 }}>
          <div style={labelStyle}>Center circle size</div>
          <p style={descStyle}>
            Size of the innermost ring in fan chart view.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <input
              type="range"
              min={FAN_ROOT_RADIUS_MIN}
              max={FAN_ROOT_RADIUS_MAX}
              step={FAN_ROOT_RADIUS_STEP}
              value={fanRootRadius}
              aria-valuemin={FAN_ROOT_RADIUS_MIN}
              aria-valuemax={FAN_ROOT_RADIUS_MAX}
              aria-valuenow={fanRootRadius}
              aria-label="Fan chart center circle size"
              onChange={(e) => onUpdateSetting("fanRootRadius", clampFanRootRadius(Number(e.target.value)))}
              style={{ flex: 1, accentColor: "var(--tree-root, #2f6f4e)" }}
            />
            <span style={sliderValueStyle}>{fanRootRadius}px</span>
          </div>
          <button type="button" onClick={() => onUpdateSetting("fanRootRadius", FAN_ROOT_RADIUS_DEFAULT)} style={resetBtnStyle}>
            Reset
          </button>
        </div>
      ) : null}
    </SettingsSection>
  );
}
