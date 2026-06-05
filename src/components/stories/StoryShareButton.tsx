"use client";

import { Share2 } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

function canUseWebShareAPI(): boolean {
  if (typeof navigator === "undefined") return false;
  const share = (navigator as Navigator & { share?: unknown }).share;
  return typeof share === "function";
}

/**
 * Single source of truth for the story share affordance (Web Share API with a
 * clipboard-copy fallback). Rendered in the cover header and the article byline
 * strip so the share logic is never duplicated.
 *
 * - `variant="cover"` — the outline button used inside `StoryCover`.
 * - `variant="pill"` — the masthead-strip pill (uppercase, fully rounded).
 */
export function StoryShareButton({
  title,
  text,
  url,
  variant = "cover",
}: {
  title: string;
  text?: string | null;
  url: string;
  variant?: "cover" | "pill";
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const share = useCallback(async () => {
    try {
      if (canUseWebShareAPI()) {
        await navigator.share({ title, text: text ?? undefined, url });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* cancelled */
    }
    setMenuOpen(false);
  }, [text, title, url]);

  const copyOnly = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* ignore */
    }
    setMenuOpen(false);
  }, [url]);

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border font-semibold uppercase tracking-wide text-text/80 hover:bg-surface-2",
          variant === "pill"
            ? "px-3.5 py-1.5 text-[11px] tracking-[0.05em]"
            : "px-3 py-1 text-xs",
        )}
        aria-expanded={menuOpen}
        onClick={() => {
          if (canUseWebShareAPI()) void share();
          else setMenuOpen((o) => !o);
        }}
      >
        <Share2 className="size-3.5" aria-hidden />
        Share
      </button>
      {menuOpen ? (
        <div className="absolute right-0 z-20 mt-2 min-w-40 rounded-lg border border-border bg-bg py-1 shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2"
            onClick={() => void copyOnly()}
          >
            Copy link
          </button>
        </div>
      ) : null}
    </div>
  );
}
