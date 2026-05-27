"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArticleView, ViewerPageRenderer } from "@/components/stories/StoryViewerPages";
import { Crest } from "@/components/wireframe/Crest";
import { cn } from "@/lib/utils";
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
  onToggleToc,
  onChangeView,
}: {
  tocOpen: boolean;
  viewMode: "story" | "article";
  onToggleToc: () => void;
  onChangeView: (v: "story" | "article") => void;
}) {
  return (
    <header className="sv-topbar">
      {/* Left: toggle + brand */}
      <div className="sv-brand">
        <button
          type="button"
          className="sv-toc-toggle"
          onClick={onToggleToc}
          aria-label={tocOpen ? "Hide contents" : "Show contents"}
        >
          {tocOpen ? "‹" : "›"}
        </button>
        <Crest size="xs" alt="Gonsalves family crest" />
        <span>StoryViewer · The Family Archive</span>
      </div>

      {/* Center: view toggle */}
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
          <svg viewBox="0 0 16 16" aria-hidden fill="none">
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
          <svg viewBox="0 0 16 16" aria-hidden fill="none">
            <path d="M3 3h10M3 5.5h10M3 7.5h7M3 9.5h10M3 11.5h10M3 13.5h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          Article
        </button>
      </div>

      {/* Right: chrome actions */}
      <div className="sv-topbar-right">
        <button type="button" className="sv-tb-item" aria-label="Share">
          <svg viewBox="0 0 16 16" aria-hidden fill="none">
            <circle cx="4" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="12" cy="4" r="1.6" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="12" cy="12" r="1.6" stroke="currentColor" strokeWidth="1.1" />
            <path d="M5.4 7.2 10.6 4.6M5.4 8.8l5.2 2.6" stroke="currentColor" strokeWidth="1.1" />
          </svg>
          <span>Share</span>
        </button>
      </div>
    </header>
  );
}

// ── TOC sidebar ───────────────────────────────────────────────────────────────

function TocSidebar({
  meta,
  toc,
  pages,
  pageIdx,
  activeId,
  viewMode,
  onGo,
}: {
  meta: CoverMeta;
  toc: ViewerTocEntry[];
  pages: ViewerPage[];
  pageIdx: number;
  activeId: string;
  viewMode: "story" | "article";
  onGo: (pageIndex: number) => void;
}) {
  const total = pages.length;

  return (
    <nav className="sv-toc" aria-label="Table of contents">
      <div className="sv-toc-eyebrow">
        <span>Contents</span>
        {meta.pages ? <span>{meta.pages} pp.</span> : null}
      </div>

      <h3
        className="sv-toc-title"
        dangerouslySetInnerHTML={{ __html: meta.collection }}
      />

      {meta.credits.length > 0 ? (
        <div className="sv-toc-credits">
          {meta.credits.map((c, i) => (
            <div key={i} className="sv-toc-credit">
              {c.role ? <span className="sv-toc-credit-role">{c.role}</span> : null}
              <span className="sv-toc-credit-name">{c.name}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="sv-toc-divider" />

      <ul className="sv-toc-list">
        {/* Cover row */}
        <li>
          <button
            type="button"
            className="sv-toc-item"
            data-active={activeId === "cover" ? "1" : "0"}
            onClick={() => onGo(0)}
          >
            <span className="sv-toc-num">00</span>
            <span className="sv-toc-label">
              <span className="kind">Cover</span>
              <span className="ttl">Frontispiece</span>
            </span>
            <span className="sv-toc-folio">—</span>
          </button>
        </li>

        {toc.map((row, i) => {
          const isChapterActive =
            row.kind === "chapter"
              ? activeId === row.chapterId
              : activeId === pages[row.pageIndex]?.id;

          return (
            <li key={`toc-${i}`}>
              <button
                type="button"
                className="sv-toc-item"
                data-active={isChapterActive ? "1" : "0"}
                onClick={() => onGo(row.pageIndex)}
              >
                <span className="sv-toc-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="sv-toc-label">
                  <span className="kind">{row.label}</span>
                  <span className="ttl">{row.title}</span>
                </span>
                <span className="sv-toc-folio">{row.folio ?? "—"}</span>
              </button>

              {/* Body page sub-rows (story mode only) */}
              {viewMode === "story" && row.kind === "chapter" && row.children.length > 0 ? (
                <ul className="sv-toc-sub-list">
                  {row.children.map((ch, j) => (
                    <li key={j}>
                      <button
                        type="button"
                        className="sv-toc-sub"
                        data-active={pageIdx === ch.pageIndex ? "1" : "0"}
                        onClick={() => onGo(ch.pageIndex)}
                      >
                        <span>{ch.title.replace(/ — continued$/, "")} <span style={{ fontStyle: "normal", fontSize: "9px", color: "var(--sv-ink-quiet)" }}>cont.</span></span>
                        <span className="f">{ch.folio}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ── Byline strip ──────────────────────────────────────────────────────────────

function Byline({ credits, hide }: { credits: CoverMeta["credits"]; hide: boolean }) {
  if (hide || credits.length === 0) return null;
  return (
    <div className="sv-byline" aria-label="Authorship">
      {credits.map((c, i) => (
        <Fragment key={i}>
          {i > 0 ? (
            <span className="sv-byline-sep" aria-hidden>
              ◦
            </span>
          ) : null}
          <span className="sv-byline-credit">
            {c.role ? <span className="sv-byline-role">{c.role}</span> : null}
            <span className="sv-byline-name">{c.name}</span>
          </span>
        </Fragment>
      ))}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  pageIdx,
  total,
  pages,
  onPrev,
  onNext,
}: {
  pageIdx: number;
  total: number;
  pages: ViewerPage[];
  onPrev: () => void;
  onNext: () => void;
}) {
  const prev = pageIdx > 0 ? pages[pageIdx - 1] : null;
  const next = pageIdx < total - 1 ? pages[pageIdx + 1] : null;
  const pct = ((pageIdx + 1) / total) * 100;

  const prevTitle = prev
    ? prev.pageKind === "cover"
      ? "Cover"
      : (prev as { title: string }).title
    : null;
  const nextTitle = next
    ? next.pageKind === "cover"
      ? "Cover"
      : (next as { title: string }).title
    : null;

  return (
    <div className="sv-pagination-bar">
      <nav className="sv-pagination" aria-label="Page navigation">
        <button
          type="button"
          className="sv-pg-btn"
          data-side="prev"
          disabled={!prev}
          onClick={onPrev}
          aria-label="Previous page"
        >
          <span className="sv-pg-arrow">‹</span>
          <span className="sv-pg-label">
            <span>Previous</span>
            {prevTitle ? <span className="ttl">{prevTitle}</span> : null}
          </span>
        </button>

        <div className="sv-pg-center">
          <div className="sv-pg-counter">
            <span className="now">{String(pageIdx + 1).padStart(2, "0")}</span>
            <span>/</span>
            <span>{String(total).padStart(2, "0")}</span>
          </div>
          <div className="sv-pg-bar">
            <i style={{ width: `${pct}%` }} aria-hidden />
          </div>
        </div>

        <button
          type="button"
          className="sv-pg-btn"
          data-side="next"
          disabled={!next}
          onClick={onNext}
          aria-label="Next page"
        >
          <span className="sv-pg-label">
            <span>Next</span>
            {nextTitle ? <span className="ttl">{nextTitle}</span> : null}
          </span>
          <span className="sv-pg-arrow">›</span>
        </button>
      </nav>
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

  const [tocOpen, setTocOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("cover");
  const sectionRefs = useRef<Record<string, HTMLElement>>({});

  const cur = pages[pageIdx];

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
      // Article mode: scroll to section
      const p = pages[idx];
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

  // View mode switch
  const changeView = useCallback(
    (v: "story" | "article") => {
      window.scrollTo({ top: 0, behavior: "instant" });
      setQuery({ view: v, page: v === "story" ? String(pageIdx) : undefined });
    },
    [pageIdx, setQuery],
  );

  // Keyboard navigation (story mode only)
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

  // Reset scroll when switching views
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

  // Derive active TOC id
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
    <div className="sv-root fixed inset-0 z-0 flex h-dvh max-h-dvh flex-col overflow-hidden">
      <div className="sv-topbar-slot shrink-0">
        <Topbar
          tocOpen={tocOpen}
          viewMode={viewMode}
          onToggleToc={() => setTocOpen((o) => !o)}
          onChangeView={changeView}
        />
      </div>

      <div
        className="sv-body flex min-h-0 flex-1 flex-row overflow-hidden"
        data-toc={tocOpen ? "1" : "0"}
        data-view={viewMode}
      >
        <div
          className={cn(
            "sv-toc-slot h-full min-h-0 shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
            tocOpen ? "w-[280px]" : "pointer-events-none w-0",
          )}
        >
          <TocSidebar
            meta={meta}
            toc={toc}
            pages={pages}
            pageIdx={pageIdx}
            activeId={activeId}
            viewMode={viewMode}
            onGo={goToPage}
          />
        </div>

        <div className="sv-stage-slot min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          {viewMode === "story" ? (
            <div className="sv-stage">
              {/* Breadcrumb + folio header */}
              <div className="sv-stage-head">
                <div>
                  {cur?.pageKind === "chapter-opener" || cur?.pageKind === "body" ? (
                    <>
                      <span>{meta.catalog}</span>
                      <span className="sep">/</span>
                      <span>{cur.pageKind === "chapter-opener"
                        ? cur.chapterNumber
                        : (pages.find(
                            (p) =>
                              p.pageKind === "chapter-opener" &&
                              p.chapterId === (cur as { chapterId: string }).chapterId,
                          ) as import("@/lib/stories/story-viewer-utils").ViewerChapterOpenerPage | undefined)?.chapterNumber ?? ""
                      }</span>
                      <span className="sep">/</span>
                      <span className="hl">{(cur as { title: string }).title}</span>
                    </>
                  ) : (
                    <>
                      <span>{meta.catalog}</span>
                      <span className="sep">/</span>
                      <span className="hl">{cur?.pageKind === "cover" ? "Cover" : (cur as { title?: string }).title ?? ""}</span>
                    </>
                  )}
                </div>
                <div>
                  <span>{pageIdx + 1} / {total}</span>
                </div>
              </div>

              {/* Byline (hidden on cover) */}
              <Byline credits={meta.credits} hide={isCover} />

              {/* Page card */}
              {cur ? (
                <ViewerPageRenderer page={cur} meta={meta} fields={fields} />
              ) : null}

              {/* Pagination footer */}
              <Pagination
                pageIdx={pageIdx}
                total={total}
                pages={pages}
                onPrev={() => setQuery({ view: "story", page: String(Math.max(0, pageIdx - 1)) })}
                onNext={() => setQuery({ view: "story", page: String(Math.min(total - 1, pageIdx + 1)) })}
              />
            </div>
          ) : (
            <ArticleView
              pages={pages}
              meta={meta}
              fields={fields}
              registerSection={registerSection}
            />
          )}
        </div>
      </div>
    </div>
  );
}
