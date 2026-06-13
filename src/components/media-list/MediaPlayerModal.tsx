"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import type { MediaListItem } from "./types";

/** Full-screen player for audio/video items (the album lightbox is image-only). */
export function MediaPlayerModal({
  item,
  onClose,
}: {
  item: MediaListItem | null;
  onClose: () => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);

  if (!item || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title || item.filename}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1a1712] text-[#f4ecd8] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 className="break-words font-heading text-lg font-semibold leading-tight">{item.filename}</h2>
            {item.title && item.title.toLowerCase() !== item.filename.toLowerCase() ? (
              <p className="mt-0.5 break-words text-sm text-[#cdbfa3]">{item.title}</p>
            ) : null}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#cdbfa3] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {item.bucket === "video" ? (
            <video
              src={item.fileUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[60vh] w-full rounded-lg bg-black"
            />
          ) : (
            <audio src={item.fileUrl} controls autoPlay className="w-full" />
          )}

          {item.description ? (
            <p className="mt-4 text-sm leading-relaxed text-[#cdbfa3]">{item.description}</p>
          ) : null}

          {item.linkedTo.length > 0 ? (
            <div className="mt-4">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#cdbfa3]/80">
                Linked to
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.linkedTo.map((link, i) => (
                  <Link
                    key={`${link.kind}-${i}`}
                    href={link.href}
                    className="inline-flex max-w-full items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-[#f4ecd8] transition hover:bg-white/15"
                  >
                    <span className="min-w-0 truncate">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
