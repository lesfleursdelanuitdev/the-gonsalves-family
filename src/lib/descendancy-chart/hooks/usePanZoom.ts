"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface PanZoomBounds {
  minX: number;
  maxX: number;
  maxY: number;
}

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;
const ZOOM_STEP = 1.2;
/** Initial scale when opening the chart (zoomed out a bit so more context is visible). */
const INITIAL_SCALE = 0.72;
/** Vertical offset for root when applying initial view and fit-to-screen. */
const INITIAL_TOP_PADDING = 110;

export interface UsePanZoomOptions {
  svgRef: React.RefObject<SVGSVGElement | null>;
  bounds: PanZoomBounds | null;
  baseX: number;
  baseY: number;
}

export function usePanZoom({
  svgRef,
  bounds,
  baseX,
  baseY,
}: UsePanZoomOptions) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(INITIAL_SCALE);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panAtDrag, setPanAtDrag] = useState({ x: 0, y: 0 });
  const hasSetInitialView = useRef(false);
  const boundsRef = useRef(bounds);
  const baseXRef = useRef(baseX);
  const baseYRef = useRef(baseY);
  /** When bounds identity changes (e.g. real tree replaces placeholder), allow applying initial view again */
  const boundsKeyRef = useRef<string | null>(null);
  boundsRef.current = bounds;
  baseXRef.current = baseX;
  baseYRef.current = baseY;
  const boundsKey = bounds ? `${bounds.minX},${bounds.maxX},${bounds.maxY}` : null;
  if (boundsKey !== boundsKeyRef.current) {
    boundsKeyRef.current = boundsKey;
    hasSetInitialView.current = false;
  }

  // When chart has bounds and viewport size, position like fit-to-screen (root near top, centered) at initial zoom.
  // Use ResizeObserver so we run once the SVG has real dimensions. Re-run when bounds change (e.g. real tree loads).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !bounds) return;

    const applyInitialView = () => {
      if (hasSetInitialView.current) return;
      const b = boundsRef.current;
      if (!b) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      hasSetInitialView.current = true;
      const px = rect.width / 2 - baseXRef.current;
      const py = INITIAL_TOP_PADDING - baseYRef.current;
      // Defer so layout is complete (SVG may not have final size in same frame)
      requestAnimationFrame(() => {
        setPan({ x: px, y: py });
        setScale(INITIAL_SCALE);
      });
    };

    applyInitialView();
    const ro = new ResizeObserver(() => {
      applyInitialView();
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, [bounds, svgRef]);

  const zoomIn = useCallback(
    () => setScale((s) => Math.min(ZOOM_MAX, s * ZOOM_STEP)),
    []
  );
  const zoomOut = useCallback(
    () => setScale((s) => Math.max(ZOOM_MIN, s / ZOOM_STEP)),
    []
  );

  /** Same view as initial load: root centered, near top, initial scale. */
  const goToInitialView = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !bounds) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const px = rect.width / 2 - baseX;
    const py = INITIAL_TOP_PADDING - baseY;
    setPan({ x: px, y: py });
    setScale(INITIAL_SCALE);
  }, [svgRef, bounds, baseX, baseY]);

  /** Pan and zoom so that the given layout position (e.g. a person's center) is centered in the viewport at initial scale. */
  const centerOnPosition = useCallback(
    (layoutX: number, layoutY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const s = INITIAL_SCALE;
      const px = rect.width / 2 - baseX - layoutX * s;
      const py = INITIAL_TOP_PADDING - baseY - layoutY * s;
      setPan({ x: px, y: py });
      setScale(s);
    },
    [svgRef, baseX, baseY]
  );

  const fitToScreen = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !bounds) return;
    const rect = svg.getBoundingClientRect();
    const tw = bounds.maxX - bounds.minX;
    const th = bounds.maxY + 100;
    const fitScale = Math.min(
      1,
      Math.min((rect.width - 160) / tw, (rect.height - 80) / th)
    );
    const s = Math.max(0.25, Math.min(1.2, fitScale));
    // Root person (layout 0,0): centered horizontally, near top of viewport
    const px = rect.width / 2 - baseX;
    const py = INITIAL_TOP_PADDING - baseY;
    setScale(s);
    setPan({ x: px, y: py });
  }, [svgRef, bounds, baseX, baseY]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanAtDrag(pan);
    },
    [pan]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      e.preventDefault();
      setPan({
        x: panAtDrag.x + (e.clientX - dragStart.x),
        y: panAtDrag.y + (e.clientY - dragStart.y),
      });
    },
    [dragging, panAtDrag, dragStart]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragging(false);
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ns = Math.min(
        3,
        Math.max(0.2, scale * (1 - e.deltaY * 0.001))
      );
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const r = ns / scale;
      setPan((prev) => ({
        x: mx - r * (mx - prev.x),
        y: my - r * (my - prev.y),
      }));
      setScale(ns);
    },
    [svgRef, scale]
  );

  return {
    pan,
    setPan,
    scale,
    setScale,
    zoomIn,
    zoomOut,
    fitToScreen,
    goToInitialView,
    centerOnPosition,
    dragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
  };
}
