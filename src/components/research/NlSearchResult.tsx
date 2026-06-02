"use client";

import { useState } from "react";
import { PlotlyChart } from "@/components/plotly/PlotlyChart";
import type { PlotlyChartProps } from "@/components/plotly";
import { nlSearchChartSpec } from "@/components/research/nlSearchChartSpec";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import { formatValue, humanizeKey } from "@/lib/analytics-format";
import { nlSearchIntentSummary } from "@/components/research/nlSearchIntentSummary";

type NlMeta = {
  status?: string;
  error?: string | null;
  elapsed_ms?: number;
  source?: string;
};

export type NlResponse = {
  query?: string;
  intent?: string;
  params?: unknown;
  confidence?: number;
  rationale?: string;
  result?: Record<string, unknown> | null;
  meta?: NlMeta;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Render shallow key-value summaries (tree_summary, etc.). */
function KeyValueSummary({ obj }: { obj: Record<string, unknown> }) {
  const pairs = Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "number" ||
    typeof v === "string" ||
    typeof v === "boolean" ||
    v === null
      ? [[k, v] as const]
      : [],
  );
  if (pairs.length === 0) return null;
  return (
    <dl className="border-border-subtle grid gap-2 rounded-lg border bg-surface-elevated py-4 text-sm md:grid-cols-2 lg:grid-cols-3">
      {pairs.map(([k, v]) => (
        <div key={k} className="px-4">
          <dt className="text-muted tracking-wide">{humanizeKey(k)}</dt>
          <dd className="text-heading font-medium">{formatValue(k, v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function RelationshipsPaths({ result }: { result: Record<string, unknown> }) {
  const paths = [["path_lca_to_source", "From common ancestor toward source"], ["path_lca_to_target", "From common ancestor toward target"]] as const;
  const blocks: { key: string; title: string; rows: Record<string, unknown>[] }[] = [];
  for (const [key, title] of paths) {
    const raw = result[key];
    if (!Array.isArray(raw) || raw.length === 0) continue;
    const rows = raw.filter((x): x is Record<string, unknown> => isPlainObject(x));
    if (rows.length) blocks.push({ key, title, rows });
  }
  if (blocks.length === 0) return null;
  return (
    <div className="space-y-6">
      {blocks.map(({ key, title, rows }) => (
        <div key={key}>
          <h3 className="text-heading mb-2 font-accent text-lg">{title}</h3>
          <ol className="border-border-subtle list-decimal space-y-2 rounded-lg border bg-surface-elevated py-3 pe-4 ps-8">
            {rows.map((r, i) => (
              <li key={String(r.id ?? i)} className="text-sm">
                <span className="text-heading font-medium">
                  {typeof r.full_name === "string" && r.full_name.trim()
                    ? formatGedcomFullNameForDisplay(r.full_name)
                    : String(r.xref ?? r.id)}
                </span>
                {r.xref ? <span className="text-muted"> · {String(r.xref)}</span> : null}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

const TABLE_PAGE_SIZE = 25;

/** Generic, client-side-paginated table for an array of objects (matches, search results, etc.). */
function ObjectArrayTable({ rows, title }: { rows: Record<string, unknown>[]; title: string }) {
  // Page state resets per result set via the `key` prop the parent passes.
  const [page, setPage] = useState(0);

  if (rows.length === 0) return null;
  const keys = Object.keys(rows[0] ?? {}).filter((k) => !k.startsWith("_"));
  const head = keys.slice(0, 12);

  const pageCount = Math.max(1, Math.ceil(rows.length / TABLE_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * TABLE_PAGE_SIZE;
  const pageRows = rows.slice(start, start + TABLE_PAGE_SIZE);

  return (
    <div className="overflow-x-auto">
      <h3 className="mb-2 font-accent text-lg text-heading">{title}</h3>
      <table className="border-border-subtle w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-border-subtle bg-surface-inset border-b">
            {head.map((k) => (
              <th key={k} className="text-muted px-3 py-2 font-medium">
                {humanizeKey(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row, i) => (
            <tr key={start + i} className="border-border-subtle odd:bg-surface-elevated/60 border-b">
              {head.map((k) => (
                <td key={k} className="text-heading max-w-[14rem] truncate px-3 py-2">
                  {formatValue(k, row[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > TABLE_PAGE_SIZE ? (
        <div className="mt-3 flex items-center justify-between gap-3 font-body text-xs text-muted">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage <= 0}
            className="border-border-subtle rounded-md border px-2.5 py-1 font-medium text-link transition hover:bg-link-soft-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span>
            Page <span className="text-heading font-medium">{safePage + 1}</span> of {pageCount}
            <span className="mx-1">·</span>
            {rows.length.toLocaleString()} rows
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="border-border-subtle rounded-md border px-2.5 py-1 font-medium text-link transition hover:bg-link-soft-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      ) : (
        <p className="text-muted mt-2 text-xs">
          {rows.length.toLocaleString()} {rows.length === 1 ? "row" : "rows"}
        </p>
      )}
    </div>
  );
}

const ARRAY_RESULT_KEYS: { key: string; title: string }[] = [
  { key: "matches", title: "Matches" },
  { key: "top_surnames", title: "Top surnames" },
  { key: "top_given_names", title: "Top given names" },
  { key: "causes", title: "Causes" },
  { key: "countries", title: "Countries" },
  { key: "occupations", title: "Occupations" },
  { key: "surnames", title: "Surnames" },
  { key: "families", title: "Families" },
  { key: "soundex_groups", title: "Soundex groups" },
  { key: "names", title: "Names" },
  { key: "by_decade", title: "By decade" },
];

export function NlSearchResult({ body }: { body: NlResponse | null }) {
  if (!body) return null;

  const intent = body.intent ?? "";
  const result = isPlainObject(body.result) ? body.result : null;
  const intentSummary = nlSearchIntentSummary(intent, result, isPlainObject(body.params) ? body.params : null);
  const chartSpec = result ? nlSearchChartSpec(intent, result) : null;

  let plotProps: PlotlyChartProps | null = null;
  if (chartSpec) {
    plotProps = {
      data: chartSpec.data,
      layout: {
        ...chartSpec.layout,
        autosize: true,
      },
      config: { responsive: true, displayModeBar: true },
      className: "rounded-xl border border-border-subtle bg-surface-inset p-2",
    };
  }

  const metaErr = body.meta?.error;

  return (
    <div className="border-border-subtle space-y-10 rounded-xl border bg-surface-2 px-6 py-8 lg:px-10">
      <header className="space-y-3">
        <p className="text-muted font-body text-xs tracking-wide uppercase">Result</p>
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-heading font-accent text-3xl">{intent ? humanizeKey(intent) : "Unknown"}</h2>
          {typeof body.confidence === "number" ? (
            <span className="bg-surface-elevated text-muted rounded-full px-3 py-1 font-body text-sm">
              confidence {(body.confidence * 100).toFixed(0)}%
            </span>
          ) : null}
          {typeof body.meta?.elapsed_ms === "number" ? (
            <span className="font-body text-sm text-muted">{body.meta.elapsed_ms} ms</span>
          ) : null}
        </div>
        {intentSummary ? (
          <p className="text-muted border-primary/40 max-w-3xl border-l-2 py-1 ps-4 font-body text-sm">
            {intentSummary}
          </p>
        ) : null}
        {(body.meta?.status === "error" || metaErr) && (
          <div className="rounded-lg border border-[#b85450]/40 bg-[#fff5f5] px-4 py-3 font-body text-sm text-[#7a2925] dark:border-red-950/60 dark:bg-red-950/30 dark:text-red-100">
            <strong>Error</strong>
            {metaErr ? `: ${metaErr}` : null}
          </div>
        )}
      </header>

      {!result ? (
        <p className="text-muted font-body text-sm">No structured result payload.</p>
      ) : (
        <>
          {intent === "relationship_between" ? <RelationshipsPaths result={result} /> : null}

          {intent === "tree_summary" && isPlainObject(result.summary) ? (
            <>
              <h3 className="text-heading font-accent text-lg">Summary</h3>
              <KeyValueSummary obj={result.summary} />
            </>
          ) : null}

          {intent === "lifespan_stats" && isPlainObject(result.summary) && !chartSpec ? (
            <div className="space-y-2">
              <h3 className="text-heading font-accent text-lg">Lifespan summary</h3>
              <KeyValueSummary obj={result.summary} />
            </div>
          ) : null}

          {plotProps ? <PlotlyChart {...plotProps} /> : null}

          {ARRAY_RESULT_KEYS.map(({ key, title }) => {
            const raw = result[key];
            if (!Array.isArray(raw) || raw.length === 0) return null;
            const rows = raw.filter((x): x is Record<string, unknown> => isPlainObject(x));
            if (rows.length === 0) return null;
            if (
              (key === "top_surnames" ||
                key === "top_given_names" ||
                key === "causes" ||
                key === "countries" ||
                key === "occupations" ||
                key === "surnames" ||
                key === "by_decade") &&
              chartSpec
            ) {
              return null;
            }
            return <ObjectArrayTable key={`${key}:${rows.length}`} rows={rows} title={title} />;
          })}

          {intent === "relationship_between" && isPlainObject(result.graph) ? (
            <div className="text-muted font-body text-xs">
              <span className="text-heading font-medium">Graph</span>:{" "}
              {String((result.graph as { node_count?: unknown }).node_count)} nodes,{" "}
              {String((result.graph as { edge_count?: unknown }).edge_count)} edges, DAG{" "}
              {String((result.graph as { dag?: unknown }).dag)}
            </div>
          ) : null}

          <details className="group">
            <summary className="text-muted cursor-pointer font-body text-sm underline decoration-dotted hover:text-heading">
              Raw JSON
            </summary>
            <pre className="border-border-subtle text-heading mt-3 max-h-[28rem] overflow-auto rounded-lg border bg-surface-elevated p-4 font-mono text-xs leading-relaxed">
              {JSON.stringify(body, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}
