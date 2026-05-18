import { describe, expect, it } from "vitest";
import {
  availableGivenNameLetters,
  computeGivenNameRankTierById,
  filterGivenNames,
  givenNameStartsWithLetter,
} from "@/lib/given-names/given-name-list-helpers";
import type { PublicGivenName } from "@/components/given-names/types";

function row(id: string, displayGivenName: string, peopleCount: number): PublicGivenName {
  return {
    id,
    givenName: displayGivenName,
    displayGivenName,
    frequency: peopleCount,
    peopleCount,
    profileHref: `/given-names/${id}`,
    individualsHref: `/individuals?givenName=${encodeURIComponent(displayGivenName)}`,
  };
}

describe("givenNameStartsWithLetter", () => {
  it("maps A–Z and non-letters", () => {
    expect(givenNameStartsWithLetter("Maria")).toBe("M");
    expect(givenNameStartsWithLetter("123")).toBe("#");
  });
});

describe("computeGivenNameRankTierById", () => {
  it("assigns top and bottom ten without overlap", () => {
    const givenNames = Array.from({ length: 15 }, (_, i) => row(`id-${i}`, `Name${i}`, 15 - i));
    const tiers = computeGivenNameRankTierById(givenNames);
    expect(tiers.get("id-0")).toBe("top10");
    expect(tiers.get("id-14")).toBe("bottom10");
  });
});

describe("filterGivenNames", () => {
  const givenNames = [row("a", "Anna", 1), row("g", "George", 100), row("z", "Zoe", 2)];
  const rankTierById = computeGivenNameRankTierById([
    ...givenNames,
    ...Array.from({ length: 8 }, (_, i) => row(`filler-${i}`, `Filler${i}`, 50)),
  ]);

  it("filters by starting letter", () => {
    const result = filterGivenNames(givenNames, {
      searchQuery: "",
      filters: { letter: "A", rankFilter: "all" },
      rankTierById,
    });
    expect(result.map((s) => s.id)).toEqual(["a"]);
  });
});

describe("availableGivenNameLetters", () => {
  it("returns only letters present in the catalog", () => {
    expect(availableGivenNameLetters([row("1", "Alpha", 1), row("2", "Beta", 1)])).toEqual(["A", "B"]);
  });
});
