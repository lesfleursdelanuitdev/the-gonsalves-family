"use client";

import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArticleView, ViewerPageRenderer } from "@/components/stories/StoryViewerPages";
import { cn } from "@/lib/utils";
import type { ReaderStoryBlock } from "@/lib/stories/story-reader-utils";
import type { ViewerPage, ViewerTocEntry } from "@/lib/stories/story-viewer-utils";
import "./story-viewer.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type CoverMeta = {
  collection: string;
  catalog: string;
  subtitle: string | null;
  edition: string | null;
  pages: number | null;
  coverSrc: string | null;
  coverCaption: string | null;
  credits: { role: string | null; name: string; note?: string | null }[];
};

type StoryFields = { title: string; subtitle: string; author: string };

// ── Topbar ────────────────────────────────────────────────────────────────────

function Topbar({
  tocOpen,
  viewMode,
  idle,
  title,
  onToggleToc,
  onChangeView,
}: {
  tocOpen: boolean;
  viewMode: "story" | "article";
  idle: boolean;
  title: string;
  onToggleToc: () => void;
  onChangeView: (v: "story" | "article") => void;
}) {
  return (
    <header className={cn("sv-topbar", idle && "sv-chrome-idle")}>
      {/* Left: hamburger + eyebrow */}
      <div className="sv-topbar-left">
        <button
          type="button"
          className="sv-icon-btn"
          onClick={onToggleToc}
          aria-label={tocOpen ? "Hide contents" : "Show contents"}
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden width="16" height="16">
            <path d="M3 4h10M3 8h10M3 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <span className="sv-brand-eyebrow">The Family Archive</span>
      </div>

      {/* Center: crest + title */}
      <div className="sv-topbar-center">
        <span className="sv-crest-mark" aria-hidden>G</span>
        <span className="sv-topbar-title">{title}</span>
      </div>

      {/* Right: view toggle (desktop) + share */}
      <div className="sv-topbar-right">
        <div className="sv-view-toggle" role="radiogroup" aria-label="View mode">
          <div
            className="sv-vt-thumb"
            style={{ left: viewMode === "story" ? "3px" : "calc(50%)" }}
            aria-hidden
          />
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === "story"}
            data-active={viewMode === "story" ? "1" : "0"}
            onClick={() => onChangeView("story")}
          >
            <svg viewBox="0 0 16 16" aria-hidden fill="none" width="13" height="13">
              <rect x="3" y="3" width="10" height="11" rx="0.5" stroke="currentColor" strokeWidth="1" />
              <path d="M5.5 6h5M5.5 8h5M5.5 10h3.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
            </svg>
            Story
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === "article"}
            data-active={viewMode === "article" ? "1" : "0"}
            onClick={() => onChangeView("article")}
          >
            <svg viewBox="0 0 16 16" aria-hidden fill="none" width="13" height="13">
              <path d="M3 3h10M3 5.5h10M3 7.5h7M3 9.5h10M3 11.5h10M3 13.5h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            Article
          </button>
        </div>
        <button type="button" className="sv-icon-btn" aria-label="Share">
          <svg viewBox="0 0 16 16" aria-hidden fill="none" width="16" height="16">
            <circle cx="4" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="12" cy="4" r="1.6" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="12" cy="12" r="1.6" stroke="currentColor" strokeWidth="1.1" />
            <path d="M5.4 7.2 10.6 4.6M5.4 8.8l5.2 2.6" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </button>
      </div>
    </header>
  );
}

// ── TOC Drawer ────────────────────────────────────────────────────────────────

function TocDrawer({
  open,
  meta,
  toc,
  pages,
  activeId,
  viewMode,
  onGo,
  onClose,
  onChangeView,
}: {
  open: boolean;
  meta: CoverMeta;
  toc: ViewerTocEntry[];
  pages: ViewerPage[];
  activeId: string;
  viewMode: "story" | "article";
  onGo: (pageIndex: number) => void;
  onClose: () => void;
  onChangeView: (v: "story" | "article") => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={cn("sv-drawer-backdrop", open && "sv-drawer-backdrop--open")}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn("sv-drawer", open && "sv-drawer--open")}
        role="dialog"
        aria-label="Table of contents"
        aria-modal="true"
      >
        <div className="sv-drawer-header">
          <div className="sv-drawer-eyebrow">
            CONTENTS{meta.pages ? ` · ${meta.pages} pp.` : ""}
          </div>
          <h3 className="sv-drawer-title" dangerouslySetInnerHTML={{ __html: meta.collection }} />
          {meta.credits.length > 0 ? (
            <div className="sv-drawer-credits">
              {meta.credits.map((c, i) => (
                <div key={i} className="sv-drawer-credit">
                  {c.role ? <span className="sv-drawer-credit-role">{c.role}</span> : null}
                  <span className="sv-drawer-credit-name">{c.name}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="sv-drawer-divider" />
        </div>

        <nav className="sv-drawer-nav" aria-label="Table of contents">
          <ul className="sv-drawer-list">
            <li>
              <button
                type="button"
                className="sv-drawer-item"
                data-active={activeId === "cover" ? "1" : "0"}
                onClick={() => { onGo(0); onClose(); }}
              >
                <span className="sv-drawer-folio sv-drawer-folio--left">—</span>
                <span className="sv-drawer-label">
                  <span className="kind">Cover</span>
                  <span className="ttl">Frontispiece</span>
                </span>
                <span className="sv-drawer-folio sv-drawer-folio--right">—</span>
              </button>
            </li>
            {toc.map((row, i) => {
              const isActive =
                row.kind === "chapter"
                  ? activeId === row.chapterId
                  : activeId === pages[row.pageIndex]?.id;
              return (
                <li key={i}>
                  <button
                    type="button"
                    className="sv-drawer-item"
                    data-active={isActive ? "1" : "0"}
                    onClick={() => { onGo(row.pageIndex); onClose(); }}
                  >
                    <span className="sv-drawer-folio sv-drawer-folio--left">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="sv-drawer-label">
                      <span className="kind">{row.label}</span>
                      <span className="ttl">{row.title}</span>
                    </span>
                    <span className="sv-drawer-folio sv-drawer-folio--right">
                      {row.folio ?? "—"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile-only footer: Story/Article toggle */}
        <div className="sv-drawer-footer">
          <div className="sv-drawer-footer-divider" />
          <div className="sv-view-toggle" role="radiogroup" aria-label="View mode">
            <div
              className="sv-vt-thumb"
              style={{ left: viewMode === "story" ? "3px" : "calc(50%)" }}
              aria-hidden
            />
            <button
              type="button"
              role="radio"
              aria-checked={viewMode === "story"}
              data-active={viewMode === "story" ? "1" : "0"}
              onClick={() => { onChangeView("story"); onClose(); }}
            >
              <svg viewBox="0 0 16 16" aria-hidden fill="none" width="13" height="13">
                <rect x="3" y="3" width="10" height="11" rx="0.5" stroke="currentColor" strokeWidth="1" />
                <path d="M5.5 6h5M5.5 8h5M5.5 10h3.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
              </svg>
              Story
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={viewMode === "article"}
              data-active={viewMode === "article" ? "1" : "0"}
              onClick={() => { onChangeView("article"); onClose(); }}
            >
              <svg viewBox="0 0 16 16" aria-hidden fill="none" width="13" height="13">
                <path d="M3 3h10M3 5.5h10M3 7.5h7M3 9.5h10M3 11.5h10M3 13.5h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              Article
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Byline strip ──────────────────────────────────────────────────────────────

function Byline({ credits, hide }: { credits: CoverMeta["credits"]; hide: boolean }) {
  if (hide || credits.length === 0) return null;
  return (
    <div className="sv-byline" aria-label="Authorship">
      {credits.map((c, i) => (
        <Fragment key={i}>
          {i > 0 ? <span className="sv-byline-sep" aria-hidden>◦</span> : null}
          <span className="sv-byline-credit">
            {c.role ? <span className="sv-byline-role">{c.role}</span> : null}
            <span className="sv-byline-name">{c.name}</span>
          </span>
        </Fragment>
      ))}
    </div>
  );
}

// ── Progress rail ─────────────────────────────────────────────────────────────

function ProgressRail({
  pageIdx,
  total,
  pages,
  idle,
  onPrev,
  onNext,
}: {
  pageIdx: number;
  total: number;
  pages: ViewerPage[];
  idle: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className={cn("sv-progress-bar", idle && "sv-chrome-idle")}>
      <div className="sv-progress-inner">
        <button
          type="button"
          className="sv-nav-btn"
          data-side="prev"
          disabled={pageIdx === 0}
          onClick={onPrev}
          aria-label="Previous page"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
            <path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sv-nav-label">Previous</span>
        </button>

        <div className="sv-progress-center">
          <div className="sv-folio-counter">
            <span className="sv-folio-now">{String(pageIdx + 1).padStart(2, "0")}</span>
            <span className="sv-folio-sep"> / </span>
            <span className="sv-folio-total">{String(total).padStart(2, "0")}</span>
          </div>
          <div className="sv-dot-rail" aria-hidden>
            {pages.map((_, i) => (
              <span key={i} className={cn("sv-dot", i === pageIdx && "sv-dot-active")} />
            ))}
          </div>
        </div>

        <button
          type="button"
          className="sv-nav-btn"
          data-side="next"
          disabled={pageIdx >= total - 1}
          onClick={onNext}
          aria-label="Next page"
        >
          <span className="sv-nav-label">Next</span>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
            <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export function StoryViewerShell({
  slug,
  pages,
  toc,
  meta,
  fields,
}: {
  slug: string;
  pages: ViewerPage[];
  toc: ViewerTocEntry[];
  meta: CoverMeta;
  fields: StoryFields;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const total = pages.length;

  const viewMode: "story" | "article" =
    sp.get("view") === "article" ? "article" : "story";
  const pageIdx = Math.max(0, Math.min(total - 1, Number(sp.get("page") ?? 0) || 0));

  const [tocOpen, setTocOpen] = useState(false);
  const [idle, setIdle] = useState(false);
  const [activeSection, setActiveSection] = useState("cover");
  const sectionRefs = useRef<Record<string, HTMLElement>>({});
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Block cache — blocks are not included in the initial page payload and are fetched lazily.
  const [blockCache, setBlockCache] = useState<Record<string, ReaderStoryBlock[]>>({});
  const cacheRef = useRef<Record<string, ReaderStoryBlock[]>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  const fetchSection = useCallback(async (sectionId: string) => {
    if (!sectionId || cacheRef.current[sectionId] || fetchingRef.current.has(sectionId)) return;
    fetchingRef.current.add(sectionId);
    try {
      const res = await fetch(`/api/story-section/${encodeURIComponent(sectionId)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { blocks: ReaderStoryBlock[] };
      const blocks = Array.isArray(data.blocks) ? data.blocks : [];
      cacheRef.current = { ...cacheRef.current, [sectionId]: blocks };
      setBlockCache(cacheRef.current);
    } finally {
      fetchingRef.current.delete(sectionId);
    }
  }, []);

  const enrichedPages = useMemo(
    () =>
      pages.map((p) => {
        if ((p.pageKind === "body" || p.pageKind === "essay") && blockCache[p.sectionId]) {
          return { ...p, blocks: blockCache[p.sectionId]! };
        }
        return p;
      }),
    [pages, blockCache],
  );

  // Fetch blocks for current page + prefetch adjacent pages on navigation.
  useEffect(() => {
    const fetchIfNeeded = (p: ViewerPage | undefined) => {
      if (p && (p.pageKind === "body" || p.pageKind === "essay")) fetchSection(p.sectionId);
    };
    fetchIfNeeded(pages[pageIdx]);
    fetchIfNeeded(pages[pageIdx + 1]);
    fetchIfNeeded(pages[pageIdx - 1]);
  }, [pageIdx, pages, fetchSection]);

  // When switching to article mode, batch-fetch all sections.
  useEffect(() => {
    if (viewMode !== "article") return;
    for (const p of pages) {
      if (p.pageKind === "body" || p.pageKind === "essay") fetchSection(p.sectionId);
    }
  }, [viewMode, pages, fetchSection]);

  const cur = enrichedPages[pageIdx];

  const setQuery = useCallback(
    (next: Record<string, string | undefined>) => {
      const p = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined) p.delete(k);
        else p.set(k, v);
      }
      router.replace(`/stories/${encodeURIComponent(slug)}?${p.toString()}`, { scroll: false });
    },
    [router, slug, sp],
  );

  const goToPage = useCallback(
    (idx: number) => {
      if (viewMode === "story") {
        setQuery({ view: "story", page: String(idx) });
        return;
      }
      const p = enrichedPages[idx];
      if (!p) return;
      const sectionId =
        p.pageKind === "cover"
          ? "cover"
          : p.pageKind === "body" || p.pageKind === "chapter-opener"
            ? p.chapterId
            : p.id;
      const el = sectionRefs.current[sectionId];
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 68;
        window.scrollTo({ top, behavior: "smooth" });
      }
    },
    [viewMode, pages, setQuery],
  );

  const changeView = useCallback(
    (v: "story" | "article") => {
      window.scrollTo({ top: 0, behavior: "instant" });
      setQuery({ view: v, page: v === "story" ? String(pageIdx) : undefined });
    },
    [pageIdx, setQuery],
  );

  const onPrev = useCallback(
    () => setQuery({ view: "story", page: String(Math.max(0, pageIdx - 1)) }),
    [pageIdx, setQuery],
  );
  const onNext = useCallback(
    () => setQuery({ view: "story", page: String(Math.min(total - 1, pageIdx + 1)) }),
    [pageIdx, total, setQuery],
  );

  // Touch swipe → page navigation (story mode only)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (viewMode !== "story") return;
    const t = e.touches[0];
    if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, [viewMode]);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (viewMode !== "story" || !touchStartRef.current) return;
    const t = e.changedTouches[0];
    if (!t) { touchStartRef.current = null; return; }
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) onNext();
    else onPrev();
  }, [viewMode, onNext, onPrev]);

  // Idle mode: 3s no input → fade chrome
  const resetIdle = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 3000);
  }, []);

  useEffect(() => {
    resetIdle();
    const events = ["pointermove", "pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdle]);

  // Keyboard navigation (story mode)
  useEffect(() => {
    if (viewMode !== "story") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches?.("input, textarea, select")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setQuery({ view: "story", page: String(Math.min(total - 1, pageIdx + 1)) });
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setQuery({ view: "story", page: String(Math.max(0, pageIdx - 1)) });
      } else if (e.key === "Home") {
        setQuery({ view: "story", page: "0" });
      } else if (e.key === "End") {
        setQuery({ view: "story", page: String(total - 1) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewMode, pageIdx, total, setQuery]);

  // Scroll to top on page change (story mode)
  useEffect(() => {
    if (viewMode !== "story") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pageIdx, viewMode]);

  // Reset scroll on view switch
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (viewMode === "story") setActiveSection("cover");
  }, [viewMode]);

  // Article mode: track active section via scroll
  useEffect(() => {
    if (viewMode !== "article") return;
    const lineFromTop = () => Math.max(80, Math.round(window.innerHeight * 0.25));
    let raf = 0;
    const update = () => {
      const line = lineFromTop();
      let best: string | null = null;
      let bestDist = Infinity;
      for (const [id, el] of Object.entries(sectionRefs.current)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > 0) {
          const d = line - r.top;
          if (d < bestDist) { bestDist = d; best = id; }
        }
      }
      if (best) setActiveSection((p) => (p === best ? p : best!));
    };
    update();
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; update(); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [viewMode]);

  const registerSection = useCallback((id: string, el: HTMLElement | null) => {
    if (el) sectionRefs.current[id] = el;
    else delete sectionRefs.current[id];
  }, []);

  const activeId =
    viewMode === "article"
      ? activeSection
      : cur?.pageKind === "cover"
        ? "cover"
        : cur?.pageKind === "body" || cur?.pageKind === "chapter-opener"
          ? (cur as { chapterId: string }).chapterId
          : (cur as { id: string }).id ?? "cover";

  const isCover = cur?.pageKind === "cover";

  return (
    <div
      className="sv-root fixed inset-0 z-0 flex h-dvh max-h-dvh flex-col overflow-hidden"
      data-idle={idle ? "1" : "0"}
    >
      {/* Topbar */}
      <div className="sv-topbar-slot shrink-0">
        <Topbar
          tocOpen={tocOpen}
          viewMode={viewMode}
          idle={idle}
          title={fields.title}
          onToggleToc={() => setTocOpen((o) => !o)}
          onChangeView={changeView}
        />
      </div>

      {/* Stage — full width (TOC is now a drawer overlay) */}
      <div
        className="sv-stage-slot min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Mobile tap zones live inside the scroll container so touch events bubble up to it */}
        {viewMode === "story" ? (
          <>
            <button
              type="button"
              className="sv-tap-zone sv-tap-prev"
              onClick={onPrev}
              aria-label="Previous page"
              tabIndex={-1}
              disabled={pageIdx === 0}
            />
            <button
              type="button"
              className="sv-tap-zone sv-tap-next"
              onClick={onNext}
              aria-label="Next page"
              tabIndex={-1}
              disabled={pageIdx >= total - 1}
            />
          </>
        ) : null}
        {viewMode === "story" ? (
          <div className="sv-stage">
            <Byline credits={meta.credits} hide={isCover} />
            {cur ? <ViewerPageRenderer page={cur} meta={meta} fields={fields} /> : null}
          </div>
        ) : (
          <ArticleView
            pages={enrichedPages}
            meta={meta}
            fields={fields}
            registerSection={registerSection}
          />
        )}
      </div>

      {/* Progress rail (story mode only) */}
      {viewMode === "story" ? (
        <ProgressRail
          pageIdx={pageIdx}
          total={total}
          pages={enrichedPages}
          idle={idle}
          onPrev={onPrev}
          onNext={onNext}
        />
      ) : null}

      {/* TOC drawer + backdrop */}
      <TocDrawer
        open={tocOpen}
        meta={meta}
        toc={toc}
        pages={enrichedPages}
        activeId={activeId}
        viewMode={viewMode}
        onGo={goToPage}
        onClose={() => setTocOpen(false)}
        onChangeView={changeView}
      />
    </div>
  );
}
