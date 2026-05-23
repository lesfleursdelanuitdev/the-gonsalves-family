"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagOption {
  id: string;
  name: string;
  color?: string | null;
}

interface TagPickerProps {
  value: TagOption | null;
  onChange: (tag: TagOption | null) => void;
  placeholder?: string;
  className?: string;
}

export function TagPicker({ value, onChange, placeholder = "Search tags…", className }: TagPickerProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const url = `/api/tree/advanced-search/tags?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return;
      const data = await res.json() as { tags: TagOption[] };
      setSuggestions(data.tags ?? []);
      setFetchedOnce(true);
      setOpen(true);
      setActiveIndex(-1);
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 200);
  }, [search]);

  const handleFocus = useCallback(() => {
    if (!fetchedOnce) { void search(""); }
    else setOpen(true);
  }, [fetchedOnce, search]);

  const select = useCallback((tag: TagOption) => {
    onChange(tag);
    setQuery(""); setSuggestions([]); setOpen(false); setActiveIndex(-1);
  }, [onChange]);

  const clear = useCallback(() => {
    onChange(null);
    setQuery(""); setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIndex >= 0) { e.preventDefault(); const s = suggestions[activeIndex]; if (s) select(s); }
    else if (e.key === "Escape") { setOpen(false); setActiveIndex(-1); }
  }, [open, suggestions, activeIndex, select]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-tag-picker]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (value) {
    return (
      <div className={cn("flex items-center gap-2.5 rounded-lg border border-[#d8cfc0] bg-white px-3 py-2", className)}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]">
          {value.color
            ? <span className="size-3 rounded-full" style={{ backgroundColor: value.color }} />
            : <Tag size={12} className="text-muted" aria-hidden />}
        </div>
        <p className="min-w-0 flex-1 truncate font-body text-sm font-medium text-text">{value.name}</p>
        <button type="button" onClick={clear}
          className="shrink-0 rounded p-0.5 text-muted transition hover:bg-black/[0.06] hover:text-text"
          aria-label="Clear tag selection">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} data-tag-picker>
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" aria-hidden />}
        <input ref={inputRef} type="text" value={query} onChange={handleInputChange}
          onKeyDown={handleKeyDown} onFocus={handleFocus}
          placeholder={placeholder}
          className="min-h-[44px] w-full rounded-lg border border-[#d8cfc0] bg-white py-2.5 pl-10 pr-8 font-body text-sm text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
          role="combobox" aria-expanded={open} aria-haspopup="listbox" aria-autocomplete="list"
        />
      </div>
      {open && (
        <ul role="listbox" className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-[#e0d8cc] bg-white shadow-[0_8px_24px_rgba(60,45,25,0.12)]">
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 font-body text-sm text-muted">{loading ? "Loading…" : "No tags found."}</li>
          ) : (
            suggestions.map((tag, i) => (
              <li key={tag.id} role="option" aria-selected={i === activeIndex}
                onMouseDown={() => select(tag)} onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 px-3 py-2.5 transition-colors",
                  i === activeIndex ? "bg-[#f5f1ea]" : "hover:bg-[#faf7f2]",
                  i > 0 && "border-t border-[#f0ead8]",
                )}>
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full">
                  {tag.color
                    ? <span className="size-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    : <Tag size={12} className="text-muted" aria-hidden />}
                </div>
                <span className="font-body text-sm text-text">{tag.name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
