"use client";

import { FamilyTreeLoading } from "./FamilyTreeLoading";
import { ChartViewport } from "./ChartViewport/ChartViewport";
import type { ChartViewportProps } from "./ChartViewport/ChartViewport";

export interface FamilyTreeCanvasProps {
  chartAdapter: unknown;
  isChartLoading: boolean;
  isMobile: boolean;
  showSearchPanel: boolean;
  chartViewportProps: ChartViewportProps;
}

export function FamilyTreeCanvas({
  chartAdapter,
  isChartLoading,
  isMobile,
  showSearchPanel,
  chartViewportProps,
}: FamilyTreeCanvasProps) {
  if (chartAdapter == null) {
    return <FamilyTreeLoading isLoading={isChartLoading} />;
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        visibility:
          isMobile && showSearchPanel ? "hidden" : "visible",
      }}
    >
      <ChartViewport {...chartViewportProps} />
    </div>
  );
}
