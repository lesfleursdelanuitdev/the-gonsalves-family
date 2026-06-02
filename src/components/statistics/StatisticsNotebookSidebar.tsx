"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatsSectionDef = {
  id: string;
  question: string;
  keywords: string[];
};

export const STATS_SECTIONS: StatsSectionDef[] = [
  {
    id: "stats-given-surnames",
    question: "What names run in the family?",
    keywords: ["names", "given", "surname", "first name", "popular", "frequency", "common", "onomastics"],
  },
  {
    id: "stats-individuals",
    question: "Who is in the tree?",
    keywords: ["people", "persons", "living", "deceased", "age", "lifespan", "birth", "death", "sex", "gender", "demographics", "oldest", "count"],
  },
  {
    id: "stats-families",
    question: "How are families structured?",
    keywords: ["families", "marriage", "children", "parents", "couples", "household", "size", "siblings", "partners"],
  },
  {
    id: "stats-events",
    question: "What life events are recorded?",
    keywords: ["events", "birth", "death", "marriage", "census", "burial", "immigration", "types", "baptism"],
  },
  {
    id: "stats-places",
    question: "Where did the family live?",
    keywords: ["places", "locations", "countries", "birthplace", "geography", "migration", "origin", "parish", "county", "state", "region"],
  },
  {
    id: "stats-dates",
    question: "What time periods are covered?",
    keywords: ["dates", "years", "decades", "chronology", "timeline", "century", "periods", "history", "range", "calendar"],
  },
  {
    id: "stats-media",
    question: "What documents and photos exist?",
    keywords: ["media", "photos", "images", "documents", "files", "attachments", "albums", "pictures", "scans", "certificates"],
  },
  {
    id: "stats-open-questions",
    question: "What is still unknown?",
    keywords: ["missing", "gaps", "unknown", "research", "questions", "incomplete", "todo", "unresolved", "verification", "unsolved"],
  },
  {
    id: "stats-notes",
    question: "What are the research notes?",
    keywords: ["notes", "annotations", "references", "N-records", "sources", "commentary", "citations", "links"],
  },
];

export function StatisticsNotebookSidebar() {
  const [collapsed, setCollapsed] = useState(false);
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

  if (collapsed) {
    return (
      <aside className="shrink-0">
        <div className="sticky top-20">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-elevated text-subtle shadow-sm transition hover:border-border hover:text-muted"
            aria-label="Expand navigation"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-60 shrink-0 xl:w-64">
      <div className="sticky top-20">
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
            <span className="font-body text-[10px] font-semibold uppercase tracking-widest text-subtle">
              Research questions
            </span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="flex h-6 w-6 items-center justify-center rounded text-subtle transition hover:bg-surface hover:text-muted"
              aria-label="Collapse navigation"
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
                placeholder="Filter sections…"
                className="w-full rounded-md border border-border-subtle bg-surface py-1.5 pl-6 pr-6 font-body text-[11px] text-heading placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-link/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 text-subtle transition hover:text-muted"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Nav links */}
          <nav aria-label="Statistics sections" className="p-1.5">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 font-body text-[11px] text-subtle">No sections match.</p>
            ) : (
              <ul className="space-y-0.5">
                {filtered.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={cn(
                        "block rounded-lg px-3 py-2 font-body text-[11px] leading-snug text-muted",
                        "transition-colors hover:bg-surface hover:text-heading",
                      )}
                    >
                      {s.question}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
