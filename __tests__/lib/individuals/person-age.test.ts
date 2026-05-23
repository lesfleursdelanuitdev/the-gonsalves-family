import { describe, expect, it } from "vitest";
import { formatPersonAgeLabel, parseDisplayDateParts } from "@/lib/individuals/person-age";

describe("parseDisplayDateParts", () => {
  it("parses day month year labels", () => {
    expect(parseDisplayDateParts("15 MAR 1994")).toEqual({ year: 1994, month: 3, day: 15 });
  });

  it("parses ISO dates", () => {
    expect(parseDisplayDateParts("1994-03-15")).toEqual({ year: 1994, month: 3, day: 15 });
  });

  it("parses year-only labels", () => {
    expect(parseDisplayDateParts("1994")).toEqual({ year: 1994, month: 0, day: 0 });
  });
});

describe("formatPersonAgeLabel", () => {
  it("includes months and days when birth date is complete", () => {
    const label = formatPersonAgeLabel(
      {
        birthDateLabel: "15 MAR 1994",
        birthYear: 1994,
        deathDateLabel: null,
        deathYear: null,
      },
      new Date(2026, 4, 16),
    );
    expect(label).toBe("32 years, 2 months, 1 day");
  });

  it("falls back to years when only birth year is known", () => {
    const label = formatPersonAgeLabel(
      {
        birthDateLabel: "1994",
        birthYear: 1994,
        deathDateLabel: null,
        deathYear: null,
      },
      new Date(2026, 4, 16),
    );
    expect(label).toBe("32 years");
  });

  it("uses death date as the end when present", () => {
    const label = formatPersonAgeLabel(
      {
        birthDateLabel: "1 JAN 1900",
        birthYear: 1900,
        deathDateLabel: "1 JUL 1950",
        deathYear: 1950,
      },
      new Date(2026, 4, 16),
    );
    expect(label).toBe("50 years, 6 months");
  });
});
