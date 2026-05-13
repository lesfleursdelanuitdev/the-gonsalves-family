"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScrapbookTagOption = { id: string; name: string };

type TagSourceSearchProps = {
  inputId: string;
  selected: ScrapbookTagOption | null;
  onSelect: (tag: ScrapbookTagOption | null) => void;
};

const inputClassName =
  "w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm text-heading shadow-inner outline-none transition placeholder:text-muted/70 focus:border-link/50 focus:ring-2 focus:ring-link/15";

export function TagSourceSearch({ inputId, selected, onSelect }: TagSourceSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<ScrapbookTagOption[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = `${inputId}-tag-listbox`;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTags = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/media-tags?q=${encodeURIComponent(search)}`);
      const data = (await res.json()) as { tags?: ScrapbookTagOption[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? res.statusText);
      }
      setTags(data.tags ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load tags");
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchTags(query.trim());
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchTags]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const handleInputChange = (v: string) => {
    setQuery(v);
    if (selected && v.trim() !== selected.name.trim()) {
      onSelect(null);
    }
    setOpen(true);
  };

  const handlePick = (tag: ScrapbookTagOption) => {
    onSelect(tag);
    setQuery(tag.name);
    setOpen(false);
  };

  const showList = open;

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <input
        id={inputId}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          setOpen(true);
          void fetchTags(query.trim());
        }}
        placeholder="Search tags used on tree media…"
        className={inputClassName}
      />

      {showList ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Matching tags"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 min-w-0 overflow-auto rounded-xl border border-border-subtle bg-surface py-1 shadow-[0_12px_28px_rgba(60,45,25,0.14)]"
        >
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-link" aria-hidden />
              Loading tags…
            </div>
          ) : null}
          {error ? (
            <p className="px-3 py-2.5 text-sm text-muted">{error}</p>
          ) : null}
          {!loading && !error && tags.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-muted">
              {query.trim() ? "No tags match that search." : "No tags are linked to media in this tree yet."}
            </p>
          ) : null}
          {!error &&
            tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                role="option"
                aria-selected={selected?.id === tag.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(tag)}
                className={cn(
                  "flex w-full min-w-0 items-center px-3 py-2.5 text-left text-sm text-heading transition",
                  "hover:bg-link-soft-bg hover:text-link-soft-fg",
                  selected?.id === tag.id && "bg-link-soft-bg/60 text-link-soft-fg",
                )}
              >
                <span className="min-w-0 break-words">{tag.name}</span>
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
