import type { PublicSurname } from "@/components/surnames/types";

export const SURNAME_LETTER_OTHER = "#";

export type SurnameRankTier = "top10" | "bottom10";
export type SurnameRankFilter = "all" | SurnameRankTier;

export type SurnameListSortMode = "az" | "za" | "mostCommon" | "leastCommon";

/** First letter bucket for A–Z filters; non-letters map to {@link SURNAME_LETTER_OTHER}. */
export function surnameStartsWithLetter(displaySurname: string): string {
  const first = displaySurname.trim().charAt(0);
  if (!first) return SURNAME_LETTER_OTHER;
  const upper = first.toUpperCase();
  if (upper >= "A" && upper <= "Z") return upper;
  return SURNAME_LETTER_OTHER;
}

const LETTERS_AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Letters A–Z (plus #) that appear at least once in the catalog. */
export function availableSurnameLetters(surnames: PublicSurname[]): string[] {
  const found = new Set<string>();
  for (const row of surnames) {
    found.add(surnameStartsWithLetter(row.displaySurname));
  }
  const letters = LETTERS_AZ.filter((l) => found.has(l));
  if (found.has(SURNAME_LETTER_OTHER)) letters.push(SURNAME_LETTER_OTHER);
  return letters;
}

/** Top / bottom ten by people in tree; overlap resolves to top 10 only. */
export function computeSurnameRankTierById(surnames: PublicSurname[]): Map<string, SurnameRankTier> {
  const byCount = [...surnames].sort(
    (a, b) => b.peopleCount - a.peopleCount || a.displaySurname.localeCompare(b.displaySurname),
  );
  const tiers = new Map<string, SurnameRankTier>();
  const topIds = new Set(byCount.slice(0, 10).map((s) => s.id));
  for (const id of topIds) tiers.set(id, "top10");
  for (const row of byCount.slice(-10)) {
    if (!topIds.has(row.id)) tiers.set(row.id, "bottom10");
  }
  return tiers;
}

export function sortSurnames(items: PublicSurname[], sortMode: SurnameListSortMode): PublicSurname[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    if (sortMode === "az") return a.displaySurname.localeCompare(b.displaySurname);
    if (sortMode === "za") return b.displaySurname.localeCompare(a.displaySurname);
    if (sortMode === "mostCommon") {
      return b.peopleCount - a.peopleCount || a.displaySurname.localeCompare(b.displaySurname);
    }
    return a.peopleCount - b.peopleCount || a.displaySurname.localeCompare(b.displaySurname);
  });
  return sorted;
}

export type SurnamesListFilters = {
  letter: string | null;
  rankFilter: SurnameRankFilter;
};

export function filterSurnames(
  surnames: PublicSurname[],
  options: {
    searchQuery: string;
    filters: SurnamesListFilters;
    rankTierById: Map<string, SurnameRankTier>;
  },
): PublicSurname[] {
  const q = options.searchQuery.trim().toLowerCase();
  const { letter, rankFilter } = options.filters;

  return surnames.filter((item) => {
    if (q) {
      const haystack = [item.displaySurname, item.surname].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (letter != null && surnameStartsWithLetter(item.displaySurname) !== letter) {
      return false;
    }
    if (rankFilter !== "all") {
      if (options.rankTierById.get(item.id) !== rankFilter) return false;
    }
    return true;
  });
}
