"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { NotesSelectedPerson } from "@/lib/notes/public-note-types";
import { cn } from "@/lib/utils";

type PickerIndividual = {
  id: string;
  xref: string;
  fullName: string;
  birthDateLabel: string | null;
};

export function NotesPersonFilterSection({
  selected,
  onChange,
}: {
  selected: NotesSelectedPerson[];
  onChange: (people: NotesSelectedPerson[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerIndividual[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIds = useMemo(() => new Set(selected.map((p) => p.id)), [selected]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: query, limit: "12" });
        const response = await fetch(`/api/tree/individual-picker?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not search people.");
        const body = (await response.json()) as { individuals?: PickerIndividual[] };
        setResults(body.individuals ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not search people.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const addPerson = (person: PickerIndividual) => {
    if (selectedIds.has(person.id)) return;
    onChange([...selected, { id: person.id, fullName: person.fullName }]);
  };

  const removePerson = (id: string) => {
    onChange(selected.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <p className="font-body text-sm leading-relaxed text-muted">
        Search by name, then select people. Notes linked to them directly, or to a family where they are a
        spouse, will appear.
      </p>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => removePerson(person.id)}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-link/15 bg-link-soft-bg px-2.5 py-1 font-body text-xs font-medium text-link transition hover:border-link/30"
            >
              <span className="min-w-0 truncate">{person.fullName}</span>
              <X className="size-3.5 shrink-0" aria-hidden />
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-[#d8cfc0] bg-white/60 px-3 py-2 font-body text-xs text-muted">
          No people selected yet.
        </p>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people by name…"
          className="min-h-[48px] w-full rounded-lg border border-[#d8cfc0] bg-white py-3 pl-10 pr-3 font-body text-base text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
          autoComplete="off"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d8cfc0] bg-white">
        {loading ? (
          <p className="px-4 py-5 text-center font-body text-sm text-muted">Searching…</p>
        ) : error ? (
          <p className="px-4 py-5 text-center font-body text-sm text-[#8F1F1F]">{error}</p>
        ) : results.length === 0 ? (
          <p className="px-4 py-5 text-center font-body text-sm text-muted">
            {query.trim() ? "No matching people." : "Type a name to search the tree."}
          </p>
        ) : (
          <ul className="divide-y divide-[#ebe4d9]">
            {results.map((person) => {
              const already = selectedIds.has(person.id);
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    disabled={already}
                    onClick={() => addPerson(person)}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left font-body text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset",
                      already
                        ? "cursor-default bg-[#f2ece4]/50 text-muted"
                        : "text-text hover:bg-black/[0.03]",
                    )}
                  >
                    <span className="font-medium text-heading">{person.fullName}</span>
                    {person.birthDateLabel ? (
                      <span className="text-xs text-muted">b. {person.birthDateLabel}</span>
                    ) : null}
                    {already ? <span className="text-xs text-link">Already selected</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
