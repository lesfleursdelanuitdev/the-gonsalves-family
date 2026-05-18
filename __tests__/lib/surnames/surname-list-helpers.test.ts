import { describe, expect, it } from "vitest";
import {
  availableSurnameLetters,
  computeSurnameRankTierById,
  filterSurnames,
  surnameStartsWithLetter,
} from "@/lib/surnames/surname-list-helpers";
import type { PublicSurname } from "@/components/surnames/types";

function row(
  id: string,
  displaySurname: string,
  peopleCount: number,
): PublicSurname {
  return {
    id,
    surname: displaySurname,
    displaySurname,
    frequency: peopleCount,
    peopleCount,
    profileHref: `/surnames/${id}`,
    individualsHref: `/individuals?lastName=${encodeURIComponent(displaySurname)}`,
  };
}

describe("surnameStartsWithLetter", () => {
  it("maps A–Z and non-letters", () => {
    expect(surnameStartsWithLetter("Gonsalves")).toBe("G");
    expect(surnameStartsWithLetter("123")).toBe("#");
  });
});

describe("computeSurnameRankTierById", () => {
  it("assigns top and bottom ten without overlap", () => {
    const surnames = Array.from({ length: 15 }, (_, i) => row(`id-${i}`, `Surname${i}`, 15 - i));
    const tiers = computeSurnameRankTierById(surnames);
    expect(tiers.get("id-0")).toBe("top10");
    expect(tiers.get("id-4")).toBe("top10");
    expect(tiers.get("id-9")).toBe("top10");
    expect(tiers.get("id-10")).toBe("bottom10");
    expect(tiers.get("id-14")).toBe("bottom10");
  });
});

describe("filterSurnames", () => {
  const surnames = [
    row("a", "Alleyne", 1),
    row("g", "Gonsalves", 100),
    row("z", "Zuniga", 2),
  ];
  const rankTierById = computeSurnameRankTierById([
    ...surnames,
    ...Array.from({ length: 8 }, (_, i) => row(`filler-${i}`, `Filler${i}`, 50)),
  ]);

  it("filters by starting letter", () => {
    const result = filterSurnames(surnames, {
      searchQuery: "",
      filters: { letter: "A", rankFilter: "all" },
      rankTierById,
    });
    expect(result.map((s) => s.id)).toEqual(["a"]);
  });

  it("filters by top ten rank", () => {
    const many = Array.from({ length: 12 }, (_, i) => row(`id-${i}`, `Name${i}`, 12 - i));
    const tiers = computeSurnameRankTierById(many);
    const result = filterSurnames(many, {
      searchQuery: "",
      filters: { letter: null, rankFilter: "top10" },
      rankTierById: tiers,
    });
    expect(result).toHaveLength(10);
  });
});

describe("availableSurnameLetters", () => {
  it("returns only letters present in the catalog", () => {
    expect(availableSurnameLetters([row("1", "Alpha", 1), row("2", "Beta", 1)])).toEqual(["A", "B"]);
  });
});
