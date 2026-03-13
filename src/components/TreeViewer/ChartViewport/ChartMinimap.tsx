"use client";

import { useLayoutEffect, useState, useRef, useCallback } from "react";
import { X } from "lucide-react";

const PREVIEW_WIDTH = 140;
const PREVIEW_HEIGHT = 100;

export interface ChartMinimapProps {
  bounds: { minX: number; maxX: number; maxY: number } | null;
  baseX: number;
  baseY: number;
  pan: { x: number; y: number };
  scale: number;
  setPan: (pan: { x: number; y: number }) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  /** When provided, a close button is shown to hide the minimap */
  onClose?: () => void;
}

/**
 * Small preview of the full graph in the lower-right. A rectangle shows the current viewport.
 * Dragging the rectangle pans the main chart to that location.
 */
export function ChartMinimap({
  bounds,
  baseX,
  baseY,
  pan,
  scale,
  setPan,
  svgRef,
  onClose,
}: ChartMinimapProps) {
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const dragStart = useRef<{ panX: number; panY: number; clientX: number; clientY: number } | null>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const update = () => {
      const rect = svg.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [svgRef]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragStart.current = { panX: pan.x, panY: pan.y, clientX: e.clientX, clientY: e.clientY };
    },
    [pan.x, pan.y]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragStart.current == null) return;
      e.preventDefault();
      const b = bounds;
      if (!b || viewportSize.width <= 0 || viewportSize.height <= 0) return;
      const boundsW = b.maxX - b.minX;
      const boundsH = b.maxY;
      if (boundsW <= 0 || boundsH <= 0) return;
      const mapScaleX = PREVIEW_WIDTH / boundsW;
      const mapScaleY = PREVIEW_HEIGHT / boundsH;
      const dx = e.clientX - dragStart.current.clientX;
      const dy = e.clientY - dragStart.current.clientY;
      const dGraphX = dx / mapScaleX;
      const dGraphY = dy / mapScaleY;
      setPan({
        x: dragStart.current.panX - dGraphX * scale,
        y: dragStart.current.panY - dGraphY * scale,
      });
    },
    [bounds, viewportSize.width, viewportSize.height, scale, setPan]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragStart.current = null;
  }, []);

  if (!bounds || viewportSize.width <= 0 || viewportSize.height <= 0) return null;

  const boundsW = bounds.maxX - bounds.minX;
  const boundsH = bounds.maxY;
  if (boundsW <= 0 || boundsH <= 0) return null;

  const mapScaleX = PREVIEW_WIDTH / boundsW;
  const mapScaleY = PREVIEW_HEIGHT / boundsH;

  const graphLeft = -(baseX + pan.x) / scale;
  const graphTop = -(baseY + pan.y) / scale;
  const graphWidth = viewportSize.width / scale;
  const graphHeight = viewportSize.height / scale;

  const rectX = (graphLeft - bounds.minX) * mapScaleX;
  const rectY = graphTop * mapScaleY;
  const rectW = Math.max(4, graphWidth * mapScaleX);
  const rectH = Math.max(4, graphHeight * mapScaleY);

  return (
    <div
      role="group"
      aria-label="Chart overview"
      className="chart-minimap-container"
      style={{
        position: "absolute",
        right: 16,
        bottom: 72,
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
        borderRadius: 8,
        overflow: "hidden",
        background: "var(--tree-panel-bg)",
        border: "1px solid var(--tree-panel-border)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
        zIndex: 10,
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .chart-minimap-container {
            bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
      `}</style>
      {onClose && (
        <>
          <style>{`
            .chart-minimap-close-btn:hover {
              background: var(--tree-button-bg) !important;
            }
            .chart-minimap-close-btn:active {
              background: var(--tree-button-bg) !important;
            }
            @media (max-width: 640px) {
              .chart-minimap-close-btn {
                min-width: 44px;
                min-height: 44px;
                width: 44px;
                height: 44px;
                top: 2px !important;
                right: 2px !important;
              }
              .chart-minimap-close-btn svg {
                width: 20px;
                height: 20px;
              }
            }
          `}</style>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close minimap"
            className="chart-minimap-close-btn"
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 28,
              height: 28,
              minWidth: 28,
              minHeight: 28,
              padding: 0,
              border: "1px solid var(--tree-panel-border)",
              borderRadius: 6,
              background: "var(--tree-panel-bg)",
              color: "var(--tree-text)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </>
      )}
      <svg
        width={PREVIEW_WIDTH}
        height={PREVIEW_HEIGHT}
        style={{ display: "block", cursor: "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <rect
          x={0}
          y={0}
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          fill="var(--tree-bg)"
        />
        <rect
          x={rectX}
          y={rectY}
          width={rectW}
          height={rectH}
          fill="rgba(0,0,0,0.2)"
          stroke="var(--tree-root)"
          strokeWidth={1.5}
          style={{ pointerEvents: "none" }}
        />
      </svg>
    </div>
  );
}
