"use client";

import { useMemo } from "react";
import { StoryShareButton } from "@/components/stories/StoryShareButton";

export function StoryCover({
  coverSrc,
  title,
  excerpt,
  authorLine,
  authorHref,
  canonicalUrl,
  showShare = true,
}: {
  coverSrc: string | null;
  title: string;
  excerpt?: string | null;
  authorLine: string | null;
  authorHref?: string | null;
  canonicalUrl: string;
  /** Show the in-cover Share control. The article page hides it because Share lives in the byline strip. */
  showShare?: boolean;
}) {
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
      <section className="relative isolate flex min-h-[min(72vw,340px)] w-full flex-col justify-end overflow-hidden bg-bg md:min-h-[400px]">
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
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 45%, transparent 72%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-bg via-bg/[0.92] to-transparent"
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-10 pt-20 text-center md:pb-12 md:pt-24">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text [text-shadow:0_1px_16px_rgba(255,255,255,0.85),0_0_40px_rgba(255,255,255,0.35)] md:text-4xl">
            {title}
          </h1>
          {excerpt?.trim() ? (
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-text/80 [text-shadow:0_1px_10px_rgba(255,255,255,0.75)] md:text-lg">
              {excerpt.trim()}
            </p>
          ) : null}
          {authorEl || showShare ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-text/70">
              {authorEl}
              {showShare ? <StoryShareButton title={title} text={excerpt} url={canonicalUrl} variant="cover" /> : null}
            </div>
          ) : null}
        </div>
      </section>
    </header>
  );
}
