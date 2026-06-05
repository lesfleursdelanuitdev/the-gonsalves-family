"use client";

import { PanelRightOpen } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { NlSearchResult, type NlResponse } from "@/components/research/NlSearchResult";
import { NlSampleQueriesDrawer } from "@/components/research/NlSampleQueriesDrawer";
import { messageFromResearchErrorJson } from "@/lib/research-api-client-error";

type Props = {
  treeId: string | null;
  inline?: boolean;
};

type SuggestState = { prompts: string[]; error: string | null };

async function readJsonThrow(res: Response): Promise<unknown> {
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(messageFromResearchErrorJson(data, res.status));
  }
  return data;
}

export function NlSearchPlayground({ treeId, inline }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [body, setBody] = useState<unknown | null>(null);
  const [suggest, setSuggest] = useState<SuggestState>({ prompts: [], error: null });
  const [sampleDrawerOpen, setSampleDrawerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function applySamplePrompt(text: string) {
    setQuery(text);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  const loadSuggestions = useCallback(async () => {
    if (!treeId) return;
    try {
      const res = await fetch(`/api/research/trees/${encodeURIComponent(treeId)}/nl-search/suggestions`, {
        cache: "no-store",
      });
      const data = await readJsonThrow(res);
      const prompts =
        data && typeof data === "object" && "prompts" in data && Array.isArray((data as { prompts?: unknown }).prompts)
          ? ((data as { prompts: string[] }).prompts.filter((p) => typeof p === "string") as string[])
          : [];
      setSuggest({ prompts, error: null });
    } catch (e) {
      setSuggest({
        prompts: [],
        error: e instanceof Error ? e.message : "Could not load suggestion prompts.",
      });
    }
  }, [treeId]);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  async function runSearch() {
    if (!treeId) return;
    const q = query.trim();
    if (!q) return;
    setFetchErr(null);
    setBody(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/research/trees/${encodeURIComponent(treeId)}/nl-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query: q, context: {} }),
      });
      const data = await readJsonThrow(res);
      setBody(data);
    } catch (e) {
      setFetchErr(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!treeId) {
    return (
      <div className="border-border-subtle text-heading rounded-xl border bg-surface-inset p-8 font-body leading-relaxed shadow-sm">
        <p className="font-accent text-xl">Research tree is not configured.</p>
        <p className="text-muted mt-3 text-sm">
          Set <code className="text-heading bg-surface px-1 py-0.5 text-xs">PUBLIC_RESEARCH_TREE_ID</code> (or{" "}
          <code className="text-heading bg-surface px-1 py-0.5 text-xs">PUBLIC_STORY_TREE_ID</code>) and ensure{" "}
          <code className="text-heading bg-surface px-1 py-0.5 text-xs">PYTHON_API_URL</code> points at the Ligneous
          Python API. See the project README for details.
        </p>
      </div>
    );
  }

  const inner = (
    <>
      <section className="border-border-subtle space-y-4 rounded-xl border bg-surface-elevated px-5 py-6 shadow-sm md:px-8 md:py-8">
        <label htmlFor="nl-query" className="text-heading sr-only">
          Search query
        </label>
        <textarea
          ref={textareaRef}
          id="nl-query"
          name="query"
          rows={4}
          placeholder="e.g. What are the most common surnames? Who was born in Guyana? Relationship between Anne and John?"
          className="border-border-subtle text-heading placeholder:text-subtle focus:ring-primary/30 w-full resize-y rounded-lg border bg-surface px-4 py-3 font-body text-base outline-none ring-0 transition focus:ring-2"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          onKeyDown={(ev) => {
            if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
              ev.preventDefault();
              void runSearch();
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={loading || query.trim().length === 0}
            onClick={() => void runSearch()}
            className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg px-6 py-2.5 font-body text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? "Searching…" : "Ask"}
          </button>
          <button
            type="button"
            onClick={() => setSampleDrawerOpen(true)}
            className="border-border-subtle text-heading hover:bg-surface hover:border-primary/35 inline-flex items-center gap-2 rounded-lg border bg-surface-2 px-3 py-2.5 font-body text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
          >
            <PanelRightOpen className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            Sample queries
          </button>
          <span className="text-subtle hidden font-body text-xs sm:inline">Ctrl+Enter to run</span>
        </div>

        {suggest.error ? <p className="text-muted font-body text-sm">{suggest.error}</p> : null}

        {suggest.prompts.length ? (
          <div>
            <p className="text-muted mb-2 font-body text-xs uppercase tracking-wide">Try a suggestion</p>
            <div className="flex flex-wrap gap-2">
              {suggest.prompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="border-border-subtle text-heading hover:bg-surface hover:border-primary/35 rounded-full border bg-surface-2 px-3 py-1.5 font-body text-sm transition"
                  onClick={() => applySamplePrompt(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {fetchErr ? (
        <div
          role="alert"
          className="border-border-subtle mt-8 rounded-lg border border-[#b85450]/35 bg-[#fff5f5] px-4 py-3 font-body text-sm text-[#6b2824]"
        >
          {fetchErr}
        </div>
      ) : null}

      <div className="mt-10">
        {body ? <NlSearchResult body={body as NlResponse | null} /> : null}
      </div>

      <NlSampleQueriesDrawer
        open={sampleDrawerOpen}
        onClose={() => setSampleDrawerOpen(false)}
        onPickSample={applySamplePrompt}
      />
    </>
  );

  if (inline) return inner;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-6 lg:max-w-6xl lg:px-8">
      <div className="mb-10">
        <h1 className="text-heading font-accent text-4xl tracking-tight">Ask the tree</h1>
        <p className="text-muted mt-3 max-w-2xl font-body text-base leading-relaxed">
          Plain-language questions route to read-only analytics intents (names, places, lifespans, relatives, and more).
          Queries are not persisted on the public site.
        </p>
      </div>
      {inner}
    </div>
  );
}
