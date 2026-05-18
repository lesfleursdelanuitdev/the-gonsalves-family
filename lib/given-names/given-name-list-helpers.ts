import type { PublicGivenName } from "@/components/given-names/types";

export const GIVEN_NAME_LETTER_OTHER = "#";

export type GivenNameRankTier = "top10" | "bottom10";
export type GivenNameRankFilter = "all" | GivenNameRankTier;

export type GivenNameListSortMode = "az" | "za" | "mostCommon" | "leastCommon";

export function givenNameStartsWithLetter(displayGivenName: string): string {
  const first = displayGivenName.trim().charAt(0);
  if (!first) return GIVEN_NAME_LETTER_OTHER;
  const upper = first.toUpperCase();
  if (upper >= "A" && upper <= "Z") return upper;
  return GIVEN_NAME_LETTER_OTHER;
}

const LETTERS_AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function availableGivenNameLetters(givenNames: PublicGivenName[]): string[] {
  const found = new Set<string>();
  for (const row of givenNames) {
    found.add(givenNameStartsWithLetter(row.displayGivenName));
  }
  const letters = LETTERS_AZ.filter((l) => found.has(l));
  if (found.has(GIVEN_NAME_LETTER_OTHER)) letters.push(GIVEN_NAME_LETTER_OTHER);
  return letters;
}

export function computeGivenNameRankTierById(
  givenNames: PublicGivenName[],
): Map<string, GivenNameRankTier> {
  const byCount = [...givenNames].sort(
    (a, b) => b.peopleCount - a.peopleCount || a.displayGivenName.localeCompare(b.displayGivenName),
  );
  const tiers = new Map<string, GivenNameRankTier>();
  const topIds = new Set(byCount.slice(0, 10).map((s) => s.id));
  for (const id of topIds) tiers.set(id, "top10");
  for (const row of byCount.slice(-10)) {
    if (!topIds.has(row.id)) tiers.set(row.id, "bottom10");
  }
  return tiers;
}

export function sortGivenNames(
  items: PublicGivenName[],
  sortMode: GivenNameListSortMode,
): PublicGivenName[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    if (sortMode === "az") return a.displayGivenName.localeCompare(b.displayGivenName);
    if (sortMode === "za") return b.displayGivenName.localeCompare(a.displayGivenName);
    if (sortMode === "mostCommon") {
      return b.peopleCount - a.peopleCount || a.displayGivenName.localeCompare(b.displayGivenName);
    }
    return a.peopleCount - b.peopleCount || a.displayGivenName.localeCompare(b.displayGivenName);
  });
  return sorted;
}

export type GivenNamesListFilters = {
  letter: string | null;
  rankFilter: GivenNameRankFilter;
};

export function filterGivenNames(
  givenNames: PublicGivenName[],
  options: {
    searchQuery: string;
    filters: GivenNamesListFilters;
    rankTierById: Map<string, GivenNameRankTier>;
  },
): PublicGivenName[] {
  const q = options.searchQuery.trim().toLowerCase();
  const { letter, rankFilter } = options.filters;

  return givenNames.filter((item) => {
    if (q) {
      const haystack = [item.displayGivenName, item.givenName].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (letter != null && givenNameStartsWithLetter(item.displayGivenName) !== letter) {
      return false;
    }
    if (rankFilter !== "all") {
      if (options.rankTierById.get(item.id) !== rankFilter) return false;
    }
    return true;
  });
}
