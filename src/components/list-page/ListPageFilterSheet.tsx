"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type ListPageFilterSheetProps = {
  open: boolean;
  ariaLabel: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Full-screen mobile bottom sheet host for catalog filter panels.
 */
export function ListPageFilterSheet({ open, ariaLabel, onClose, children }: ListPageFilterSheetProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[10040] font-body">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Dismiss filter"
        onClick={onClose}
      />
      <div
        className="album-filter-sheet-enter absolute bottom-0 left-0 right-0 flex max-h-[min(88dvh,720px)] min-h-0 flex-col overflow-hidden rounded-t-2xl border border-[#e8e0d4] bg-[#f5f1ea] shadow-[0_-12px_48px_rgba(0,0,0,0.14)]"
        role="dialog"
        aria-label={ariaLabel}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
