"use client";

import { useMemo, useRef, useState } from "react";
import { ChartContent } from "../ChartContent";
import { ChartMinimap } from "./ChartMinimap";
import { ChartViewportLoading } from "./ChartViewportLoading";
import { ChartViewportBottomBar } from "./ChartViewportBottomBar";
import { ChartViewportGridBackground } from "./ChartViewportGridBackground";
import { ChartViewportRightVerticalMenu } from "./ChartViewportRightVerticalMenu";
import { ChartViewportOverlayContext } from "./ChartViewportOverlayContext";
import type {
  ChartNode,
  ChartViewStrategyName,
  ConnectorHelpers,
  ViewState,
} from "@/genealogy-visualization-engine";
import type { PersonCardAction } from "@/genealogy-visualization-engine";
import type { OnNameClick } from "../../../DescendancyChart/FamilyTreeNodes/TreeNodes";
import type { ChartSettingsV2 } from "../ChartPanels/SettingsPanel";

export interface ChartViewportProps {
  isLoading: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  baseX: number;
  baseY: number;
  pan: { x: number; y: number };
  scale: number;
  root: ChartNode;
  rootId: string;
  onAction: (action: PersonCardAction, personId: string) => void;
  onNameClick?: OnNameClick;
  settings: ChartSettingsV2;
  /** Connectors from builder.getCurrentStrategy()?.connectors. */
  connectors?: ConnectorHelpers;
  dragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onGoToPerson: () => void;
  /** Descendancy only; omit for pedigree. */
  onToggleAllSpouses?: () => void;
  /** For minimap: full graph bounds and setPan to move viewport when dragging minimap rect */
  bounds?: { minX: number; maxX: number; maxY: number } | null;
  setPan?: (pan: { x: number; y: number }) => void;
  /** When true, minimap is hidden (e.g. on mobile to keep Go To Person / Toggle All Partners visible). */
  isMobile?: boolean;
  /** For collapse/expand subtree. */
  viewState?: ViewState;
  chartStrategy?: ChartViewStrategyName;
  /** When true, sibling view is active; on mobile show a legend button below the right controls. */
  hasSiblingView?: boolean;
  showLegendPanel?: boolean;
  onToggleLegendPanel?: () => void;
  /** Debug panel: toggle shown at top of right controls. */
  showDebugPanel?: boolean;
  onToggleDebugPanel?: () => void;
}

export function ChartViewport({
  isLoading,
  svgRef,
  baseX,
  baseY,
  pan,
  scale,
  root,
  rootId,
  onAction,
  onNameClick,
  settings,
  connectors,
  dragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onGoToPerson,
  onToggleAllSpouses,
  bounds = null,
  setPan,
  viewState,
  chartStrategy = "descendancy",
  isMobile = false,
  hasSiblingView = false,
  showLegendPanel = false,
  onToggleLegendPanel,
  showDebugPanel = false,
  onToggleDebugPanel,
}: ChartViewportProps) {
  const [minimapOpen, setMinimapOpen] = useState(true);
  const minimapCapable = bounds != null && setPan != null && !isMobile;
  const minimapAllowedBySettings = settings.showMinimap !== false;
  const showMinimapToggle = minimapCapable && minimapAllowedBySettings;
  const chartViewportRef = useRef<HTMLDivElement>(null);
  const viewportOverlayValue = useMemo(
    () => ({ containerRef: chartViewportRef, chromeRightInsetPx: 92 }),
    []
  );

  return (
    <ChartViewportOverlayContext.Provider value={viewportOverlayValue}>
    <div
      ref={chartViewportRef}
      style={{
        flex: 1,
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <ChartViewportLoading isLoading={isLoading} />
      <style>{`
        .chart-viewport-svg {
          min-height: calc(var(--app-height, 100svh) - 101px);
        }
        @media (max-width: 640px) {
          .chart-viewport-svg {
            min-height: 0;
          }
        }
      `}</style>
      <svg
        ref={svgRef}
        className="chart-viewport-svg"
        style={{
          position: "relative",
          zIndex: 0,
          width: "100%",
          height: "100svh",
          cursor: dragging ? "grabbing" : "grab",
          display: "block",
          background: "var(--tree-bg)",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <g transform={`translate(${baseX + pan.x}, ${baseY + pan.y}) scale(${scale})`}>
          <ChartViewportGridBackground />
          <ChartContent
            root={root}
            rootId={rootId}
            onAction={onAction}
            onNameClick={onNameClick}
            settings={settings}
            connectors={connectors}
            viewState={viewState}
            chartStrategy={chartStrategy}
            isMobile={isMobile}
          />
        </g>
      </svg>
      {showMinimapToggle && minimapOpen && (
        <ChartMinimap
          bounds={bounds}
          baseX={baseX}
          baseY={baseY}
          pan={pan}
          scale={scale}
          setPan={setPan}
          svgRef={svgRef}
          onClose={() => setMinimapOpen(false)}
        />
      )}
      <ChartViewportRightVerticalMenu
        isMobile={isMobile}
        scale={scale}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFitToScreen={onFitToScreen}
        showDebugPanel={showDebugPanel}
        onToggleDebugPanel={onToggleDebugPanel}
        showMinimapToggle={showMinimapToggle}
        minimapOpen={minimapOpen}
        onMinimapOpen={() => setMinimapOpen(true)}
        hasSiblingView={hasSiblingView}
        showLegendPanel={showLegendPanel}
        onToggleLegendPanel={onToggleLegendPanel}
      />
      <ChartViewportBottomBar
        isMobile={isMobile}
        onGoToPerson={onGoToPerson}
        onToggleAllSpouses={onToggleAllSpouses}
      />
    </div>
    </ChartViewportOverlayContext.Provider>
  );
}
