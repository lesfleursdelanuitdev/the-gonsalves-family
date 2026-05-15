"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { DEFAULT_MAX_DEPTH } from "@/genealogy-visualization-engine";
import { cn } from "@/lib/utils";

type ChartOption = {
  chart: string;
  label: string;
  description: string;
  count: number;
};

type ApiPayload = {
  xref: string;
  displayName: string;
  depth: number;
  options: ChartOption[];
};

function treeViewerHref(xref: string, chart: string, depth: number): string {
  const root = encodeURIComponent(xref.trim());
  return `/tree/viewer?root=${root}&chart=${encodeURIComponent(chart)}&depth=${String(depth)}`;
}

export function PersonCardTreeModalTrigger({
  personId,
  xref,
  fullName,
  triggerClassName,
  triggerChildren,
  active = false,
  showActiveDot = false,
  onOpenChange,
  triggerAriaLabel = "View in tree",
}: {
  personId: string;
  xref: string;
  fullName: string;
  /** When set, replaces the default full-width card trigger (e.g. mobile nav pill). */
  triggerClassName?: string;
  triggerChildren?: ReactNode;
  active?: boolean;
  showActiveDot?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** `aria-label` on the trigger button (e.g. profile header icon). */
  triggerAriaLabel?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ApiPayload | null>(null);

  const loadOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/person-chart-options?personId=${encodeURIComponent(personId)}`);
      const data = (await res.json().catch(() => ({}))) as ApiPayload & { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not load chart options.");
        setPayload(null);
        return;
      }
      setPayload({
        xref: data.xref,
        displayName: data.displayName,
        depth: data.depth ?? DEFAULT_MAX_DEPTH,
        options: Array.isArray(data.options) ? data.options : [],
      });
    } catch {
      setError("Network error.");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [personId]);

  const onOpen = () => {
    setOpen(true);
    void loadOptions();
  };

  const onClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>("button[data-autofocus]")?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, loading, payload]);

  const depth = payload?.depth ?? DEFAULT_MAX_DEPTH;
  const rootXref = payload?.xref ?? xref;

  return (
    <>
      <button
        type="button"
        aria-label={triggerAriaLabel}
        title={triggerAriaLabel}
        onClick={onOpen}
        className={cn(
          triggerClassName ??
            "inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg",
          showActiveDot && "relative",
        )}
      >
        {triggerChildren ?? "View in tree"}
        {showActiveDot && active ? (
          <span className="absolute bottom-1.5 h-0.5 w-1.5 rounded-full bg-link/70" aria-hidden />
        ) : null}
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[10100] flex items-center justify-center p-4 sm:p-6"
              role="presentation"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/50"
                aria-label="Close dialog"
                onClick={onClose}
              />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                  "relative z-[10101] flex max-h-[min(90dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border-subtle/90",
                  "bg-surface-elevated shadow-[0_24px_60px_rgba(40,28,18,0.22)]",
                )}
              >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-subtle/70 px-5 py-4">
                  <div className="min-w-0">
                    <p id={titleId} className="font-heading text-lg font-semibold leading-snug text-heading">
                      Open in tree
                    </p>
                    <p className="mt-1 truncate text-sm text-muted" title={fullName}>
                      {fullName}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Root = this person · depth {depth} (same default as the tree viewer)
                    </p>
                  </div>
                  <button
                    type="button"
                    data-autofocus
                    onClick={onClose}
                    className="shrink-0 rounded-md p-2 text-muted transition hover:bg-black/[0.05] hover:text-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    aria-label="Close"
                  >
                    <X className="size-5" strokeWidth={1.75} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] px-5 py-4">
                  {loading ? (
                    <p className="py-6 text-center text-sm text-muted">Loading chart sizes…</p>
                  ) : error ? (
                    <p className="py-4 text-center text-sm text-red-800">{error}</p>
                  ) : payload && payload.options.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {payload.options.map((opt) => (
                        <li key={opt.chart}>
                          <Link
                            href={treeViewerHref(rootXref, opt.chart, depth)}
                            onClick={onClose}
                            className="flex w-full flex-col rounded-xl border border-border-subtle/80 bg-surface px-4 py-3 text-left shadow-sm transition hover:border-link/25 hover:bg-link-soft-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                          >
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="font-heading text-base font-semibold text-heading">{opt.label}</span>
                              <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 font-body text-xs font-semibold tabular-nums text-primary">
                                {opt.count.toLocaleString()} {opt.count === 1 ? "person" : "people"}
                              </span>
                            </span>
                            <span className="mt-1 text-xs leading-relaxed text-muted">{opt.description}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted">No chart options available.</p>
                  )}
                </div>

                <div className="shrink-0 border-t border-border-subtle/70 px-5 py-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
