"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, X } from "lucide-react";
import { NL_SEARCH_SAMPLE_QUERIES, type NlSearchSampleQuery } from "@/components/research/nlSearchSampleQueries";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type NlSampleQueriesDrawerProps = {
  open: boolean;
  onClose: () => void;
  onPickSample: (query: string) => void;
};

export function NlSampleQueriesDrawer({ open, onClose, onPickSample }: NlSampleQueriesDrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const root = panelRef.current;
    if (!root) return;

    const getFocusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
      );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = getFocusables();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const grouped = React.useMemo(() => {
    const m = new Map<string, NlSearchSampleQuery[]>();
    for (const row of NL_SEARCH_SAMPLE_QUERIES) {
      const list = m.get(row.category);
      if (list) list.push(row);
      else m.set(row.category, [row]);
    }
    return [...m.entries()];
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="nl-sample-queries-backdrop"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="Close sample queries"
            className="fixed inset-0 z-[10002] bg-black/40 backdrop-blur-[1px]"
            onClick={onClose}
          />
          <motion.div
            key="nl-sample-queries-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="nl-sample-queries-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="border-border-subtle fixed top-0 right-0 bottom-0 z-[10003] flex w-[min(400px,100vw)] min-h-0 flex-col border-l bg-surface-elevated shadow-[-12px_0_40px_rgba(0,0,0,0.08)]"
          >
            <div className="border-border-subtle flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
              <div className="min-w-0">
                <div className="text-muted mb-1 flex items-center gap-2 font-body text-xs font-medium uppercase tracking-wide">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Try a phrase
                </div>
                <h2 id="nl-sample-queries-title" className="text-heading font-accent text-lg leading-snug tracking-tight">
                  Sample queries
                </h2>
                <p className="text-muted mt-1 font-body text-sm leading-relaxed">
                  Tap one to fill the box; edit names or places to match your tree, then Search.
                </p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className="border-border-subtle text-heading hover:bg-surface shrink-0 rounded-lg border bg-surface-2 p-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
                aria-label="Close sample queries drawer"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <ul className="space-y-6">
                {grouped.map(([category, rows]) => (
                  <li key={category}>
                    <p className="text-subtle mb-2 font-body text-[11px] font-semibold uppercase tracking-wider">{category}</p>
                    <ul className="space-y-2">
                      {rows.map((row) => (
                        <li key={`${category}-${row.query}`}>
                          <button
                            type="button"
                            className="border-border-subtle text-heading hover:bg-surface hover:border-primary/30 w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-left font-body text-sm leading-snug transition"
                            onClick={() => {
                              onPickSample(row.query);
                              onClose();
                            }}
                          >
                            {row.query}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
