"use client";

import { useState, useEffect } from "react";
import { ChartContent } from "../ChartContent";
import { ZoomControls } from "./ZoomControls";
import { PanControls } from "./PanControls";
import { ChartMinimap } from "./ChartMinimap";
import { Map, Info, Bug } from "lucide-react";
import type { ChartNode, ConnectorHelpers } from "@/descendancy-chart";
import type { PersonCardAction } from "@/descendancy-chart";
import type { ChartSettings } from "../ChartPanels/SettingsPanel";

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
  settings: ChartSettings;
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
  onPan: (dx: number, dy: number) => void;
  onGoToPerson: () => void;
  onToggleAllSpouses: () => void;
  /** When true (e.g. header open on desktop), position Go To Person tab higher from bottom */
  shiftGoToPersonUp?: boolean;
  /** For minimap: full graph bounds and setPan to move viewport when dragging minimap rect */
  bounds?: { minX: number; maxX: number; maxY: number } | null;
  setPan?: (pan: { x: number; y: number }) => void;
  /** When true, minimap is hidden (e.g. on mobile to keep Go To Person / Toggle All Partners visible). */
  isMobile?: boolean;
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
  onPan,
  onGoToPerson,
  onToggleAllSpouses,
  shiftGoToPersonUp = false,
  bounds = null,
  setPan,
  isMobile = false,
  hasSiblingView = false,
  showLegendPanel = false,
  onToggleLegendPanel,
  showDebugPanel = false,
  onToggleDebugPanel,
}: ChartViewportProps) {
  const [minimapOpen, setMinimapOpen] = useState(true);
  const showMinimapToggle = bounds != null && setPan != null && !isMobile;

  // Position bottom bar from visual viewport so it stays visible when mobile keyboard opens
  const BOTTOM_OFFSET = isMobile ? 0 : 10;
  const BOTTOM_BAR_HEIGHT = 44;
  const [bottomBarStyle, setBottomBarStyle] = useState<{
    top?: number;
    left?: number;
    bottom?: number;
    transform: string;
  }>({ bottom: BOTTOM_OFFSET, transform: "translateX(-50%)" });
  const [bottomBarVisible, setBottomBarVisible] = useState(false);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const offset = isMobile ? 0 : 10;
    let showTimeout: ReturnType<typeof setTimeout> | null = null;
    const SETTLE_MS = 150;

    const update = () => {
      setBottomBarStyle({
        top: vv.offsetTop + vv.height - offset - BOTTOM_BAR_HEIGHT,
        left: vv.offsetLeft + vv.width / 2,
        transform: "translate(-50%, 0)",
      });
      setBottomBarVisible(false);
      if (showTimeout) clearTimeout(showTimeout);
      showTimeout = setTimeout(() => setBottomBarVisible(true), SETTLE_MS);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      if (showTimeout) clearTimeout(showTimeout);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [isMobile]);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            background: "var(--tree-bg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
          aria-live="polite"
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid var(--tree-divider)",
              borderTopColor: "var(--crimson)",
              borderRadius: "50%",
              animation: "chart-loading-spin 0.8s linear infinite",
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "var(--heading)",
              fontFamily: "var(--font-heading-raw), serif",
            }}
          >
            Loading tree…
          </p>
        </div>
      )}
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
          <defs>
            <pattern
              id="chart-grid"
              patternUnits="userSpaceOnUse"
              patternContentUnits="userSpaceOnUse"
              width={32}
              height={32}
            >
              <circle
                cx={16}
                cy={16}
                r={1.5}
                fill="var(--tree-text-subtle)"
                opacity={0.28}
              />
            </pattern>
          </defs>
          <rect
            x={-50000}
            y={-50000}
            width={100000}
            height={100000}
            fill="url(#chart-grid)"
            style={{ pointerEvents: "none" }}
          />
          <ChartContent
            root={root}
            rootId={rootId}
            onAction={onAction}
            settings={settings}
            connectors={connectors}
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
      <div
        className={isMobile ? "chart-viewport-right-controls chart-viewport-right-controls-mobile" : "chart-viewport-right-controls"}
        style={{
          position: "absolute",
          right: isMobile ? 3 : 16,
          top: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 10,
        }}
      >
        <style>{`
          .chart-viewport-right-controls-mobile button {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            min-height: 32px !important;
          }
        `}</style>
        {onToggleDebugPanel && !isMobile && (
          <>
            <style>{`
              .chart-debug-toggle-panel button:hover {
                background: var(--tree-button-bg) !important;
              }
            `}</style>
            <div
              role="group"
              aria-label="Debug panel"
              className="chart-debug-toggle-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 6,
                background: "var(--tree-panel-bg)",
                border: "1px solid var(--tree-panel-border)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={onToggleDebugPanel}
                aria-label={showDebugPanel ? "Close debug panel" : "Open debug panel"}
                aria-pressed={showDebugPanel}
                style={{
                  width: 36,
                  height: 36,
                  border: "none",
                  background: showDebugPanel ? "var(--hover-overlay)" : "transparent",
                  color: showDebugPanel ? "var(--tree-root)" : "var(--tree-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Bug size={16} strokeWidth={2} />
              </button>
            </div>
          </>
        )}
        <ZoomControls
          scale={scale}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFitToScreen={onFitToScreen}
        />
        <PanControls onPan={onPan} />
        {showMinimapToggle && !minimapOpen && (
          <>
            <style>{`
              .chart-minimap-open-panel button:hover {
                background: var(--tree-button-bg) !important;
              }
            `}</style>
            <div
              role="group"
              aria-label="Show minimap"
              className="chart-minimap-open-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 6,
                background: "var(--tree-panel-bg)",
                border: "1px solid var(--tree-panel-border)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setMinimapOpen(true)}
                aria-label="Show minimap"
                style={{
                  width: 36,
                  height: 36,
                  border: "none",
                  background: "transparent",
                  color: "var(--tree-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Map size={16} strokeWidth={2} />
              </button>
            </div>
          </>
        )}
        {isMobile && hasSiblingView && onToggleLegendPanel && (
          <>
            <style>{`
              .chart-legend-btn-mobile:hover {
                background: var(--tree-button-bg) !important;
              }
            `}</style>
            <div
              role="group"
              aria-label="Sibling legend"
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 6,
                background: "var(--tree-panel-bg)",
                border: "1px solid var(--tree-panel-border)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={onToggleLegendPanel}
                aria-label="Sibling legend"
                className="chart-legend-btn-mobile"
                style={{
                  width: 36,
                  height: 36,
                  border: "none",
                  background: showLegendPanel ? "var(--hover-overlay)" : "transparent",
                  color: showLegendPanel ? "var(--tree-root)" : "var(--tree-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Info size={16} strokeWidth={2} />
              </button>
            </div>
          </>
        )}
      </div>
      {!isMobile && (
        <div
          className="chart-viewport-bottom-buttons"
          style={{
            position: "fixed",
            ...bottomBarStyle,
            zIndex: 10,
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: 8,
            opacity: bottomBarVisible ? 1 : 0,
            pointerEvents: bottomBarVisible ? "auto" : "none",
            transition: "opacity 0.15s ease-out",
          }}
        >
          <style>{`
            .chart-viewport-bottom-btn:hover {
              background: var(--tree-button-bg) !important;
            }
          `}</style>
          <div
            role="group"
            aria-label="Go to person"
            style={{
              borderRadius: 6,
              background: "var(--tree-panel-bg)",
              border: "1px solid var(--tree-panel-border)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={onGoToPerson}
              aria-label="Go to person"
              className="chart-viewport-bottom-btn"
              style={{
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                color: "var(--tree-text)",
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Go To Person
            </button>
          </div>
          <div
            role="group"
            aria-label="Toggle all partners"
            style={{
              borderRadius: 6,
              background: "var(--tree-panel-bg)",
              border: "1px solid var(--tree-panel-border)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={onToggleAllSpouses}
              aria-label="Toggle all partners"
              className="chart-viewport-bottom-btn"
              style={{
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                color: "var(--tree-text)",
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Toggle All Partners
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
