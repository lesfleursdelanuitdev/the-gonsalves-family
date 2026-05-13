"use client";

import { useMemo } from "react";
import type { FamilyTreeHeaderProps } from "../FamilyTreeHeader";
import type { ChartViewportProps } from "../ChartViewport/ChartViewport";
import type { FamilyTreeOverlaysProps } from "../FamilyTreeOverlays";
import type { ChartMenuRootActionDeps } from "../ChartHeader";
import { resolveConnectorsForStrategy } from "../chartStrategy";
import { buildFamilyTreeHeaderProps } from "./buildFamilyTreeHeaderProps";
import { buildChartViewportProps } from "./buildChartViewportProps";
import { buildFamilyTreeOverlaysProps } from "./buildFamilyTreeOverlaysProps";

export interface UseFamilyTreeRenderPropsParams {
  header: Omit<FamilyTreeHeaderProps, "rootActionDeps"> & { rootActionDeps: unknown };
  viewport: Omit<ChartViewportProps, "connectors"> & {
    chartAdapter: { getDescriptor: () => unknown } | null;
    chartStrategy: ChartViewportProps["chartStrategy"];
    effectivePersonHeight: number;
  };
  overlays: FamilyTreeOverlaysProps;
}

export function useFamilyTreeRenderProps({
  header,
  viewport,
  overlays,
}: UseFamilyTreeRenderPropsParams) {
  const chartViewportConnectors = useMemo(
    () =>
      viewport.chartAdapter
        ? (resolveConnectorsForStrategy(
            viewport.chartStrategy ?? "descendancy",
            viewport.chartAdapter.getDescriptor() as never,
            viewport.effectivePersonHeight
          ) ?? undefined)
        : undefined,
    [viewport.chartAdapter, viewport.chartStrategy, viewport.effectivePersonHeight]
  );

  const familyTreeHeaderProps = buildFamilyTreeHeaderProps({
    ...header,
    rootActionDeps: header.rootActionDeps as ChartMenuRootActionDeps,
  });

  const chartViewportProps = buildChartViewportProps({
    ...viewport,
    connectors: chartViewportConnectors,
  });

  const familyTreeOverlaysProps = buildFamilyTreeOverlaysProps(overlays);

  return {
    familyTreeHeaderProps,
    chartViewportProps,
    familyTreeOverlaysProps,
  };
}
