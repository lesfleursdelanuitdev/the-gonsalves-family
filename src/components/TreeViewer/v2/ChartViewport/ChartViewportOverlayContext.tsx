"use client";

import { createContext, useContext, type RefObject } from "react";

/** Right vertical toolbar, minimap, bottom bar use this layer; keep person overflow menus under it. */
export const CHART_VIEWPORT_CHROME_Z_INDEX = 10;

/** Person-card overflow menu (portaled HTML) sits above SVG cards but below chrome. */
export const CHART_PERSON_OVERFLOW_MENU_Z_INDEX = 9;

export interface ChartViewportOverlayContextValue {
  containerRef: RefObject<HTMLDivElement | null>;
  /** Position menus to the left of floating controls (toolbar width + margin). */
  chromeRightInsetPx: number;
}

export const ChartViewportOverlayContext = createContext<ChartViewportOverlayContextValue | null>(null);

export function useChartViewportOverlay() {
  return useContext(ChartViewportOverlayContext);
}
