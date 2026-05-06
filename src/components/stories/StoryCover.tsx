"use client";

import { Share2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function canUseWebShareAPI(): boolean {
  if (typeof navigator === "undefined") return false;
  const share = (navigator as Navigator & { share?: unknown }).share;
  return typeof share === "function";
}

export function StoryCover({
  coverSrc,
  profileSrc,
  title,
  excerpt,
  authorLine,
  authorHref,
  canonicalUrl,
}: {
  coverSrc: string | null;
  profileSrc: string | null;
  title: string;
  excerpt?: string | null;
  authorLine: string | null;
  authorHref?: string | null;
  canonicalUrl: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const share = useCallback(async () => {
    try {
      if (canUseWebShareAPI()) {
        await navigator.share({ title, text: excerpt ?? undefined, url: canonicalUrl });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(canonicalUrl);
      }
    } catch {
      /* cancelled */
    }
    setMenuOpen(false);
  }, [canonicalUrl, excerpt, title]);

  const copyOnly = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(canonicalUrl);
      }
    } catch {
      /* ignore */
    }
    setMenuOpen(false);
  }, [canonicalUrl]);

  const authorEl = useMemo(() => {
    if (!authorLine) return null;
    const multiline = authorLine.includes("\n");
    const linkSingleLine = Boolean(authorHref) && !multiline;
    if (linkSingleLine) {
      return (
        <a href={authorHref!} className="text-link underline-offset-2 hover:text-link-hover">
          {authorLine}
        </a>
      );
    }
    return <span className="whitespace-pre-line">{authorLine}</span>;
  }, [authorHref, authorLine]);

  return (
    <header className="relative isolate w-full overflow-hidden">
      <section className="relative isolate min-h-[min(88vw,320px)] w-full overflow-hidden bg-bg md:min-h-[360px]">
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverSrc} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover object-center" aria-hidden />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-2 via-surface to-bg" aria-hidden />
        )}
        <div className="absolute inset-0 bg-bg/42 backdrop-blur-md dark:bg-bg/42 md:backdrop-blur-sm" aria-hidden />
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 50%)" }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-10 pt-16 md:pb-14 md:pt-20">
          <div className="relative -mb-10 mt-4 md:-mb-12">
            {profileSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileSrc}
                alt=""
                className="size-24 rounded-full border-4 border-bg object-cover shadow-lg ring-2 ring-border md:size-28"
              />
            ) : (
              <div className="size-24 rounded-full border-4 border-bg bg-surface-2 ring-2 ring-border md:size-28" />
            )}
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-14 text-center md:pt-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">{title}</h1>
        {excerpt?.trim() ? <p className="mt-3 text-base leading-relaxed text-text/75 md:text-lg">{excerpt.trim()}</p> : null}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-text/70">
          {authorEl}
          <div className="relative">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text/80 hover:bg-surface-2",
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
                <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={() => void copyOnly()}>
                  Copy link
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
