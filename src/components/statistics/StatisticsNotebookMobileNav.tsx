"use client";

import { useMemo, useState } from "react";
import { ListPageMobileControls } from "@/components/list-page";
import { STATS_SECTIONS } from "./StatisticsNotebookSidebar";

/**
 * Mobile sticky footer for the Statistics Notebook.
 * Reuses ListPageMobileControls for consistent visual style, with
 * section anchor links rendered in belowSearchSlot.
 */
export function StatisticsNotebookMobileNav() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATS_SECTIONS;
    return STATS_SECTIONS.filter(
      (s) =>
        s.question.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }, [query]);

  const sectionChips = (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Jump to section"
    >
      {filtered.length === 0 ? (
        <span className="px-1 font-body text-xs text-subtle">No sections match.</span>
      ) : (
        filtered.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            role="listitem"
            onClick={() => setQuery("")}
            className="inline-flex shrink-0 items-center rounded-2xl border border-border-subtle bg-[rgba(255,250,240,0.58)] px-3 py-1.5 font-body text-xs font-medium text-heading shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:border-link/40 hover:bg-link-soft-bg hover:text-link active:scale-95"
          >
            {s.question}
          </a>
        ))
      )}
    </div>
  );

  return (
    <ListPageMobileControls
      entityName="section"
      searchPlaceholder="Filter by research question…"
      panelId="stats-mobile-nav-panel"
      filterDefaultLabel="Filter sections"
      sortAriaLabel="Jump to section"
      searchQuery={query}
      onSearchQueryChange={setQuery}
      filterLabel="Filter sections"
      filterMenuOpen={false}
      onOpenFilters={() => {}}
      sortMode=""
      onSortModeChange={() => {}}
      sortOptions={[]}
      showFilterButton={false}
      trailingSlot={<></>}
      belowSearchSlot={sectionChips}
    />
  );
}
