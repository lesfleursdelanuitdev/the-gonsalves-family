"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatsTocItem } from "@/lib/stats-entities";

type Props = {
  toc: StatsTocItem[];
  children: React.ReactNode;
};

/**
 * Full-width two-column layout for an entity statistics page.
 * Left: sticky collapsible TOC sidebar with search.
 * Right: stats content spanning remaining width.
 */
export function StatsEntityShell({ toc, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return toc;
    return toc.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q),
    );
  }, [toc, query]);

  return (
    <div className="flex w-full items-start gap-6 lg:gap-8">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      {collapsed ? (
        <aside className="shrink-0">
          <div className="sticky top-20">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-elevated text-subtle shadow-sm transition hover:border-border hover:text-muted"
              aria-label="Expand contents"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </aside>
      ) : (
        <aside className="w-56 shrink-0 xl:w-64">
          <div className="sticky top-20">
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
                <span className="font-body text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  On this page
                </span>
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="flex h-6 w-6 items-center justify-center rounded text-subtle transition hover:bg-surface hover:text-muted"
                  aria-label="Collapse contents"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
              </div>

              {/* Search */}
              <div className="border-b border-border-subtle px-3 py-2">
                <div className="relative flex items-center">
                  <Search className="absolute left-2 size-3 text-subtle" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter…"
                    className="w-full rounded-md border border-border-subtle bg-surface py-1.5 pl-6 pr-6 font-body text-[11px] text-heading placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-link/40"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear"
                      className="absolute right-2 text-subtle transition hover:text-muted"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* TOC links */}
              <nav aria-label="Page sections" className="p-1.5">
                {filtered.length === 0 ? (
                  <p className="px-3 py-3 font-body text-[11px] text-subtle">Nothing matches.</p>
                ) : (
                  <ul className="space-y-0.5">
                    {filtered.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          title={item.question}
                          className={cn(
                            "block rounded-lg px-3 py-2 font-body text-[11px] leading-snug text-muted",
                            "transition-colors hover:bg-surface hover:text-heading",
                          )}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </nav>
            </div>
          </div>
        </aside>
      )}

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1 pb-36 sm:pb-0">
        {children}
      </div>
    </div>
  );
}
