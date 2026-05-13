"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScrapbookPlaceOption = { id: string; name: string };

type PlaceSourceSearchProps = {
  inputId: string;
  selected: ScrapbookPlaceOption | null;
  onSelect: (place: ScrapbookPlaceOption | null) => void;
};

const inputClassName =
  "w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm text-heading shadow-inner outline-none transition placeholder:text-muted/70 focus:border-link/50 focus:ring-2 focus:ring-link/15";

export function PlaceSourceSearch({ inputId, selected, onSelect }: PlaceSourceSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [places, setPlaces] = useState<ScrapbookPlaceOption[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = `${inputId}-place-listbox`;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPlaces = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/places-search?q=${encodeURIComponent(search)}`);
      const data = (await res.json()) as { places?: ScrapbookPlaceOption[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? res.statusText);
      }
      setPlaces(data.places ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load places");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchPlaces(query.trim());
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchPlaces]);

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

  const handlePick = (place: ScrapbookPlaceOption) => {
    onSelect(place);
    setQuery(place.name);
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
          void fetchPlaces(query.trim());
        }}
        placeholder="Search places in the tree…"
        className={inputClassName}
      />

      {showList ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Matching places"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 min-w-0 overflow-auto rounded-xl border border-border-subtle bg-surface py-1 shadow-[0_12px_28px_rgba(60,45,25,0.14)]"
        >
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-link" aria-hidden />
              Loading places…
            </div>
          ) : null}
          {error ? (
            <p className="px-3 py-2.5 text-sm text-muted">{error}</p>
          ) : null}
          {!loading && !error && places.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-muted">
              {query.trim() ? "No places match that search." : "No places found for this tree."}
            </p>
          ) : null}
          {!error &&
            places.map((place) => (
              <button
                key={place.id}
                type="button"
                role="option"
                aria-selected={selected?.id === place.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(place)}
                className={cn(
                  "flex w-full min-w-0 items-center px-3 py-2.5 text-left text-sm text-heading transition",
                  "hover:bg-link-soft-bg hover:text-link-soft-fg",
                  selected?.id === place.id && "bg-link-soft-bg/60 text-link-soft-fg",
                )}
              >
                <span className="min-w-0 break-words">{place.name}</span>
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
