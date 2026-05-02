"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const WHEEL_SENS = 0.0012;
const KEYBOARD_ZOOM_FACTOR = 1.25;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

type Transform = { scale: number; tx: number; ty: number };

const initialTransform: Transform = { scale: 1, tx: 0, ty: 0 };

type TransformAction =
  | { type: "reset" }
  | { type: "wheel"; cx: number; cy: number; factor: number }
  | { type: "zoom_anchor"; cx: number; cy: number; nextScale: number }
  | { type: "pan"; dx: number; dy: number };

function transformReducer(s: Transform, a: TransformAction): Transform {
  switch (a.type) {
    case "reset":
      return initialTransform;
    case "wheel": {
      const next = clamp(s.scale * a.factor, MIN_SCALE, MAX_SCALE);
      if (next <= MIN_SCALE + 1e-6) return initialTransform;
      const ratio = next / s.scale;
      return {
        scale: next,
        tx: a.cx - (a.cx - s.tx) * ratio,
        ty: a.cy - (a.cy - s.ty) * ratio,
      };
    }
    case "zoom_anchor": {
      const next = clamp(a.nextScale, MIN_SCALE, MAX_SCALE);
      if (next <= MIN_SCALE + 1e-6) return initialTransform;
      const ratio = next / s.scale;
      return {
        scale: next,
        tx: a.cx - (a.cx - s.tx) * ratio,
        ty: a.cy - (a.cy - s.ty) * ratio,
      };
    }
    case "pan":
      return { ...s, tx: s.tx + a.dx, ty: s.ty + a.dy };
    default:
      return s;
  }
}

function distance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function midpoint(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

export type LightboxZoomableImageProps = {
  src: string;
  alt?: string;
  resetKey: string | number;
  onZoomPanActiveChange?: (active: boolean) => void;
  className?: string;
};

export function LightboxZoomableImage({
  src,
  alt = "",
  resetKey,
  onZoomPanActiveChange,
  className,
}: LightboxZoomableImageProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [t, dispatch] = useReducer(transformReducer, initialTransform);
  const tRef = useRef(t);
  tRef.current = t;

  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startTx: number;
    startTy: number;
  } | null>(null);

  const pinchDistRef = useRef<number | null>(null);

  useEffect(() => {
    dispatch({ type: "reset" });
    pinchDistRef.current = null;
    dragRef.current = null;
  }, [resetKey, src]);

  /** React passive wheel listeners cannot always cancel scroll; use capture + non-passive. */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect();
      const ax = e.clientX;
      const ay = e.clientY;
      if (ax < rect.left || ax > rect.right || ay < rect.top || ay > rect.bottom) return;
      e.preventDefault();
      const cx = ax - rect.left;
      const cy = ay - rect.top;
      const delta = -e.deltaY;
      const factor = 1 + delta * WHEEL_SENS;
      dispatch({ type: "wheel", cx, cy, factor });
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [src]);

  useEffect(() => {
    const active = t.scale > 1.02 || Math.abs(t.tx) > 1 || Math.abs(t.ty) > 1;
    onZoomPanActiveChange?.(active);
  }, [t.scale, t.tx, t.ty, onZoomPanActiveChange]);

  const zoomInCenter = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    dispatch({
      type: "zoom_anchor",
      cx: r.width / 2,
      cy: r.height / 2,
      nextScale: tRef.current.scale * KEYBOARD_ZOOM_FACTOR,
    });
  }, []);

  const zoomOutCenter = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    dispatch({
      type: "zoom_anchor",
      cx: r.width / 2,
      cy: r.height / 2,
      nextScale: tRef.current.scale / KEYBOARD_ZOOM_FACTOR,
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomInCenter();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomOutCenter();
      } else if (e.key === "0") {
        e.preventDefault();
        dispatch({ type: "reset" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomInCenter, zoomOutCenter]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (tRef.current.scale <= 1.01) return;
      if (e.button !== 0) return;
      dragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startTx: tRef.current.tx,
        startTy: tRef.current.ty,
      };
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dispatch({
      type: "pan",
      dx: e.clientX - d.startClientX,
      dy: e.clientY - d.startClientY,
    });
    d.startClientX = e.clientX;
    d.startClientY = e.clientY;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragRef.current = null;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t0 = e.touches[0]!;
      const t1 = e.touches[1]!;
      pinchDistRef.current = distance(t0, t1);
      dragRef.current = null;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2 || pinchDistRef.current == null) return;
    if (e.cancelable) e.preventDefault();
    const el = viewportRef.current;
    if (!el) return;
    const t0 = e.touches[0]!;
    const t1 = e.touches[1]!;
    const d1 = distance(t0, t1);
    const m = midpoint(t0, t1);
    const rect = el.getBoundingClientRect();
    const vx = m.x - rect.left;
    const vy = m.y - rect.top;
    const ratio = d1 / Math.max(pinchDistRef.current, 1);
    const cur = tRef.current;
    const next = clamp(cur.scale * ratio, MIN_SCALE, MAX_SCALE);
    dispatch({ type: "zoom_anchor", cx: vx, cy: vy, nextScale: next });
    pinchDistRef.current = d1;
  }, []);

  const onTouchEnd = useCallback(() => {
    pinchDistRef.current = null;
  }, []);

  const cursorClass = t.scale > 1.01 ? "cursor-grab active:cursor-grabbing touch-none" : "touch-pan-y";

  return (
    <div
      ref={viewportRef}
      className={cn("relative flex min-h-0 flex-1 overflow-hidden", cursorClass, className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="pointer-events-none flex size-full items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          decoding="async"
          draggable={false}
          className={cn(
            "pointer-events-auto max-h-full max-w-full select-none object-contain",
            t.scale > 1.01 && "will-change-transform",
          )}
          style={{
            transform: `translate3d(${t.tx}px, ${t.ty}px, 0) scale(${t.scale})`,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  );
}
