"use client";

import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { Crest } from "@/components/wireframe";
import { getChartStrategyLabel } from "../chartStrategy";

interface ChartHeaderTitleProps {
  displayName?: string | null;
  isMobile?: boolean;
  chartStrategy?: ChartViewStrategyName;
}

export function ChartHeaderTitle({
  displayName,
  isMobile,
  chartStrategy = "descendancy",
}: ChartHeaderTitleProps) {
  const subtitleSize = "0.6rem";
  const titleSize = isMobile ? 12 : 13;
  const modeLabel = getChartStrategyLabel(chartStrategy);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 8 : 12,
        minWidth: 0,
      }}
    >
      <div className="shrink-0" aria-hidden>
        <Crest size={isMobile ? "compact" : "sm"} alt="" />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          className="section-subtitle mb-0.5"
          style={{ fontSize: subtitleSize, margin: 0, lineHeight: 1.2 }}
        >
          The Gonsalves family tree
        </p>
        <h2
          className="font-heading font-semibold tracking-tight text-heading min-w-0"
          style={{ fontSize: titleSize, margin: 0, lineHeight: 1.25 }}
        >
          {displayName ? (
            <>
              {displayName} — <span className="italic">{modeLabel}</span>
            </>
          ) : (
            <span className="italic">{modeLabel}</span>
          )}
        </h2>
      </div>
    </div>
  );
}
