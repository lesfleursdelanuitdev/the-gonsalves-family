"use client";

import { SettingsSection } from "./SettingsSection";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import {
  DEFAULT_PEDIGREE_PARENT_PAIR_GAP,
  FAN_CHART_DEFAULTS,
} from "@/genealogy-visualization-engine";
import type { ChartSettingsV2 } from "./SettingsPanel";
import { isFanChartStrategy } from "../chartStrategy";

const PARENT_PAIR_GAP_MIN = 4;
const PARENT_PAIR_GAP_MAX = 64;
const PARENT_PAIR_GAP_STEP = 2;
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

function clampFanRootRadius(px: number): number {
  const n = Math.round(px / FAN_ROOT_RADIUS_STEP) * FAN_ROOT_RADIUS_STEP;
  return Math.min(FAN_ROOT_RADIUS_MAX, Math.max(FAN_ROOT_RADIUS_MIN, n));
}

export function SettingsPanelViewOptions({
  chartStrategy,
  settings,
  onUpdateSetting,
}: SettingsPanelViewOptionsProps) {
  const showPedigreePairSpacing = chartStrategy === "pedigree";
  const showFanRootRadius = isFanChartStrategy(chartStrategy);

  if (!showPedigreePairSpacing && !showFanRootRadius) {
    return (
      <SettingsSection title="Layout">
        <p style={{ color: "var(--tree-text-muted)", fontSize: 13, margin: 0 }}>None</p>
      </SettingsSection>
    );
  }

  const gap = clampParentPairGap(
    Number.isFinite(settings.parentPairGap) ? settings.parentPairGap : DEFAULT_PEDIGREE_PARENT_PAIR_GAP
  );
  const fanRootRadius = clampFanRootRadius(
    Number.isFinite(settings.fanRootRadius) ? settings.fanRootRadius : FAN_ROOT_RADIUS_DEFAULT
  );

  return (
    <SettingsSection title="Layout">
      {showPedigreePairSpacing ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "var(--tree-text)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Parent pair spacing
          </div>
          <p style={{ color: "var(--tree-text-subtle)", fontSize: 11, lineHeight: 1.45, margin: "0 0 10px" }}>
            Controls the vertical space between stacked parent cards in horizontal pedigree views (gap from the
            bottom of the first parent’s card to the top of the second). Does not change generation order or
            relationships.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <input
              type="range"
              min={PARENT_PAIR_GAP_MIN}
              max={PARENT_PAIR_GAP_MAX}
              step={PARENT_PAIR_GAP_STEP}
              value={gap}
              aria-valuemin={PARENT_PAIR_GAP_MIN}
              aria-valuemax={PARENT_PAIR_GAP_MAX}
              aria-valuenow={gap}
              aria-label="Parent pair vertical spacing in pixels"
              onChange={(e) => onUpdateSetting("parentPairGap", clampParentPairGap(Number(e.target.value)))}
              style={{ flex: 1, accentColor: "var(--tree-root, #2f6f4e)" }}
            />
            <span
              style={{
                minWidth: 44,
                textAlign: "right",
                fontSize: 12,
                fontVariantNumeric: "tabular-nums",
                color: "var(--tree-text-muted)",
              }}
            >
              {gap}px
            </span>
          </div>
          <button
            type="button"
            onClick={() => onUpdateSetting("parentPairGap", DEFAULT_PEDIGREE_PARENT_PAIR_GAP)}
            style={{
              padding: "6px 10px",
              fontSize: 11,
              borderRadius: 8,
              border: "1px solid var(--tree-button-border)",
              background: "var(--surface-elevated)",
              color: "var(--tree-text)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Reset to default ({DEFAULT_PEDIGREE_PARENT_PAIR_GAP}px)
          </button>
        </div>
      ) : null}
      {showFanRootRadius ? (
        <div style={{ marginBottom: 4 }}>
          <div style={{ color: "var(--tree-text)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Center circle radius
          </div>
          <p style={{ color: "var(--tree-text-subtle)", fontSize: 11, lineHeight: 1.45, margin: "0 0 10px" }}>
            Controls the size of the centermost circle in fan chart view.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <input
              type="range"
              min={FAN_ROOT_RADIUS_MIN}
              max={FAN_ROOT_RADIUS_MAX}
              step={FAN_ROOT_RADIUS_STEP}
              value={fanRootRadius}
              aria-valuemin={FAN_ROOT_RADIUS_MIN}
              aria-valuemax={FAN_ROOT_RADIUS_MAX}
              aria-valuenow={fanRootRadius}
              aria-label="Fan chart center circle radius in pixels"
              onChange={(e) => onUpdateSetting("fanRootRadius", clampFanRootRadius(Number(e.target.value)))}
              style={{ flex: 1, accentColor: "var(--tree-root, #2f6f4e)" }}
            />
            <span
              style={{
                minWidth: 44,
                textAlign: "right",
                fontSize: 12,
                fontVariantNumeric: "tabular-nums",
                color: "var(--tree-text-muted)",
              }}
            >
              {fanRootRadius}px
            </span>
          </div>
          <button
            type="button"
            onClick={() => onUpdateSetting("fanRootRadius", FAN_ROOT_RADIUS_DEFAULT)}
            style={{
              padding: "6px 10px",
              fontSize: 11,
              borderRadius: 8,
              border: "1px solid var(--tree-button-border)",
              background: "var(--surface-elevated)",
              color: "var(--tree-text)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Reset to default ({FAN_ROOT_RADIUS_DEFAULT}px)
          </button>
        </div>
      ) : null}
    </SettingsSection>
  );
}
