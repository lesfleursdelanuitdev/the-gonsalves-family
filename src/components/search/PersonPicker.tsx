"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PersonOption {
  id: string;
  xref: string;
  displayName: string;
  portraitSrc: string | null;
  birthYear: number | null;
  deathYear: number | null;
  isLiving: boolean;
}

interface PersonPickerProps {
  value: PersonOption | null;
  onChange: (person: PersonOption | null) => void;
  placeholder?: string;
  className?: string;
}

function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]![0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]![0]?.toUpperCase() ?? "") : "";
  return (first + last) || "?";
}

function subline(person: PersonOption): string {
  if (person.birthYear || person.deathYear) {
    const born = person.birthYear ? String(person.birthYear) : "?";
    const died = person.isLiving ? "present" : (person.deathYear ? String(person.deathYear) : "?");
    return `${born} – ${died}`;
  }
  return person.xref;
}

function PersonAvatar({ person, size = 8 }: { person: PersonOption; size?: 8 | 10 }) {
  const dim = size === 10 ? "size-10" : "size-8";
  const text = size === 10 ? "text-sm" : "text-xs";
  if (person.portraitSrc) {
    return (
      <div className={cn("relative shrink-0 overflow-hidden rounded-full border border-border-subtle", dim)}>
        <Image src={person.portraitSrc} alt={person.displayName} fill className="object-cover sepia-[0.15]" sizes={size === 10 ? "40px" : "32px"} />
      </div>
    );
  }
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[#f5f1ea]", dim)}>
      <span className={cn("font-heading font-semibold text-link", text)}>{initials(person.displayName)}</span>
    </div>
  );
}

export function PersonPicker({ value, onChange, placeholder = "Search for a person…", className }: PersonPickerProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PersonOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const url = `/api/tree/advanced-search?scope=individuals&q=${encodeURIComponent(q)}&nameField=fullName&matchType=contains&limit=8`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return;
      const data = await res.json() as { individuals: PersonOption[] };
      setSuggestions(data.individuals ?? []);
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
    debounceRef.current = setTimeout(() => search(q), 250);
  }, [search]);

  const select = useCallback((person: PersonOption) => {
    onChange(person);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }, [onChange]);

  const clear = useCallback(() => {
    onChange(null);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const s = suggestions[activeIndex];
      if (s) select(s);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }, [open, suggestions, activeIndex, select]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-person-picker]")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (value) {
    return (
      <div className={cn("flex items-center gap-2.5 rounded-lg border border-[#d8cfc0] bg-white px-3 py-2", className)}>
        <PersonAvatar person={value} size={8} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-sm font-medium text-text">{value.displayName}</p>
          <p className="font-body text-xs text-muted">{subline(value)}</p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="shrink-0 rounded p-0.5 text-muted transition hover:bg-black/[0.06] hover:text-text"
          aria-label="Clear person selection"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} data-person-picker>
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" aria-hidden />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className="min-h-[44px] w-full rounded-lg border border-[#d8cfc0] bg-white py-2.5 pl-10 pr-8 font-body text-sm text-text outline-none placeholder:text-muted/70 focus:border-[#c4b8a8] focus:ring-1 focus:ring-[#8b2e2e]/25"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-[#e0d8cc] bg-white shadow-[0_8px_24px_rgba(60,45,25,0.12)]"
        >
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 font-body text-sm text-muted">No people found.</li>
          ) : (
            suggestions.map((person, i) => (
              <li
                key={person.id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => select(person)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 px-3 py-2.5 transition-colors",
                  i === activeIndex ? "bg-[#f5f1ea]" : "hover:bg-[#faf7f2]",
                  i > 0 && "border-t border-[#f0ead8]",
                )}
              >
                <PersonAvatar person={person} size={8} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium text-text">{person.displayName}</p>
                  <p className="font-body text-xs text-muted">{subline(person)}</p>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
