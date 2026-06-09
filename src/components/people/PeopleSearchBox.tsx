"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * Find People hub search box. Submits to the existing /individuals directory,
 * pre-filtered by surname so visitors land on real results with full filters.
 */
export function PeopleSearchBox() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/individuals?lastName=${encodeURIComponent(q)}` : "/individuals");
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search people"
      className="flex min-w-0 max-w-xl flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="people-search" className="sr-only">
        Search people by name
      </label>
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          id="people-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="w-full rounded-xl border border-border-subtle bg-surface px-9 py-3 text-sm text-heading shadow-inner outline-none transition placeholder:text-muted/70 focus:border-link/50 focus:ring-2 focus:ring-link/15"
        />
      </div>
      <button
        type="submit"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        Search people
      </button>
    </form>
  );
}
