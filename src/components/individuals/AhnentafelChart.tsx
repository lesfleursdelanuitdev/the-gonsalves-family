"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useLivingPrivacyDisplay } from "@/hooks/useLivingPrivacyDisplay";
import { buildLoginWallPath } from "@/lib/auth/public-viewer";

// ── Types ─────────────────────────────────────────────────────────────────────

type AhnentafelEntry = {
  num: number;
  generation: number;
  id: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  deathDate: string | null;
  deathPlace: string | null;
  isLiving: boolean;
};

type AhnentafelResponse = {
  entries: AhnentafelEntry[];
  loadedDepth: number;
  hasMore: boolean;
  error?: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_DEPTH = 4;
const LOAD_MORE_STEP = 4;

const GEN_LABELS: Record<number, string> = {
  1: "Subject",
  2: "Parents",
  3: "Grandparents",
  4: "Great-grandparents",
  5: "Great-great-grandparents",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function genLabel(gen: number): string {
  if (gen in GEN_LABELS) return GEN_LABELS[gen];
  return `${gen - 2}× great-grandparents`;
}

function extractYear(s: string | null | undefined): string | null {
  if (!s) return null;
  const m = s.match(/\b(\d{4})\b/);
  return m ? m[1] : null;
}

function livingBirthYear(e: AhnentafelEntry): string | null {
  return extractYear(e.birthDate);
}

function lifespan(e: AhnentafelEntry): string | null {
  if (e.isLiving) return null;
  const b = extractYear(e.birthDate);
  const d = extractYear(e.deathDate);
  if (b && d) return `${b}–${d}`;
  if (b) return `b. ${b}`;
  if (d) return `d. ${d}`;
  return null;
}

function personName(e: AhnentafelEntry): string {
  const parts = [e.firstName, e.lastName].filter(Boolean);
  return parts.join(" ") || "Unknown";
}

function groupByGeneration(entries: AhnentafelEntry[]): Map<number, AhnentafelEntry[]> {
  const map = new Map<number, AhnentafelEntry[]>();
  for (const e of entries) {
    const list = map.get(e.generation) ?? [];
    list.push(e);
    map.set(e.generation, list);
  }
  return map;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AhnentafelChart({ xref }: { xref: string }) {
  const { shouldShowMinimalLiving, formatMinimalLivingLabel } = useLivingPrivacyDisplay();
  const [depth, setDepth] = useState(INITIAL_DEPTH);
  const [entries, setEntries] = useState<AhnentafelEntry[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    setError(null);

    fetch(`/api/tree/individuals/${encodeURIComponent(xref)}/ahnentafel?depth=${depth}`)
      .then((r) => r.json() as Promise<AhnentafelResponse>)
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setError(json.error);
          return;
        }
        setEntries(json.entries);
        setHasMore(json.hasMore);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load ancestor list.");
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [xref, depth]);

  // ── Loading (initial) ──────────────────────────────────────────────────────

  if (fetching && entries === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted" aria-hidden />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <p className="rounded-xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-8 text-center font-body text-sm text-muted">
        {error}
      </p>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────

  if (!entries || entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-8 text-center font-body text-sm text-muted">
        No ancestor records found.
      </p>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const grouped = groupByGeneration(entries);
  const sortedGens = Array.from(grouped.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-7">
      {sortedGens.map((gen) => {
        const genEntries = grouped.get(gen)!;
        // Max possible slots: 2^(gen-1). Used to show completeness.
        const maxSlots = Math.pow(2, gen - 1);
        const showCount = gen > 1 && genEntries.length < maxSlots;

        return (
          <section key={gen} aria-label={`Generation ${gen}: ${genLabel(gen)}`}>
            {/* Generation header */}
            <div className="mb-2 flex items-baseline gap-2 border-b border-border-subtle/60 pb-2">
              <span className="font-body text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted/70">
                Gen {gen}
              </span>
              <h3 className="font-body text-sm font-semibold text-text">
                {genLabel(gen)}
              </h3>
              {showCount && (
                <span className="ml-auto font-body text-xs text-muted/50">
                  {genEntries.length} of {maxSlots} known
                </span>
              )}
            </div>

            {/* Entry list */}
            <ul className="divide-y divide-border-subtle/40">
              {genEntries.map((entry) => {
                const restricted = shouldShowMinimalLiving(entry.isLiving);
                const ls = restricted ? livingBirthYear(entry) : lifespan(entry);
                const place = !entry.isLiving ? (entry.birthPlace ?? null) : null;
                const secondaryParts = restricted
                  ? [ls ? `b. ${ls}` : null]
                  : [ls, place].filter(Boolean);
                const secondary = secondaryParts.join(" · ");
                const label = restricted
                  ? formatMinimalLivingLabel(personName(entry), livingBirthYear(entry) ? Number(livingBirthYear(entry)) : null)
                  : personName(entry);

                return (
                  <li key={entry.num} className="flex items-start gap-3 py-2.5">
                    {/* Ahnentafel number */}
                    <span className="mt-0.5 w-8 shrink-0 text-right font-mono text-[0.7rem] leading-5 text-muted/40 select-none">
                      {entry.num}.
                    </span>

                    <div className="min-w-0 flex-1">
                      {restricted ? (
                        <Link
                          href={buildLoginWallPath(`/individuals/${encodeURIComponent(entry.id)}`)}
                          className="font-body text-sm font-medium text-link hover:underline"
                        >
                          {label}
                        </Link>
                      ) : (
                        <Link
                          href={`/individuals/${encodeURIComponent(entry.id)}`}
                          className="font-body text-sm font-medium text-link hover:underline"
                        >
                          {label}
                        </Link>
                      )}
                      {!restricted && secondary && (
                        <p className="mt-0.5 font-body text-xs leading-relaxed text-muted">
                          {secondary}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {/* Load less / load more */}
      {(depth > INITIAL_DEPTH || hasMore) && (
        <div className="flex items-center justify-center gap-3 pt-1">
          {depth > INITIAL_DEPTH && (
            <button
              type="button"
              onClick={() => setDepth((d) => Math.max(INITIAL_DEPTH, d - LOAD_MORE_STEP))}
              disabled={fetching}
              className="inline-flex items-center gap-2 rounded-lg border border-border-subtle/80 bg-surface px-4 py-2.5 font-body text-xs font-semibold text-link shadow-sm transition hover:border-link/30 hover:bg-link-soft-bg disabled:opacity-60"
            >
              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
              Show less
            </button>
          )}
          {hasMore && (
            <button
              type="button"
              onClick={() => setDepth((d) => d + LOAD_MORE_STEP)}
              disabled={fetching}
              className="inline-flex items-center gap-2 rounded-lg border border-border-subtle/80 bg-surface px-4 py-2.5 font-body text-xs font-semibold text-link shadow-sm transition hover:border-link/30 hover:bg-link-soft-bg disabled:opacity-60"
            >
              {fetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              )}
              Load {LOAD_MORE_STEP} more generations
            </button>
          )}
        </div>
      )}
    </div>
  );
}
