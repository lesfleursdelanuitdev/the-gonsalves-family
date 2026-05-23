import { describe, expect, it } from "vitest";
import {
  formatGedcomFullNameForDisplay,
  formatGender,
  parseFullName,
  yearFromDisplayDateString,
} from "@/lib/individual-mapper";

// ── parseFullName ─────────────────────────────────────────────────────────────

describe("parseFullName", () => {
  it("returns null firstName and lastName for null input", () => {
    expect(parseFullName(null)).toEqual({ firstName: null, lastName: null });
  });

  it("returns null for blank string", () => {
    expect(parseFullName("   ")).toEqual({ firstName: null, lastName: null });
  });

  it("parses GEDCOM format 'Given /Surname/'", () => {
    expect(parseFullName("Alice /Gonsalves/")).toEqual({ firstName: "Alice", lastName: "Gonsalves" });
  });

  it("parses GEDCOM format with multiple given names", () => {
    expect(parseFullName("Maria João /Ferreira/")).toEqual({
      firstName: "Maria João",
      lastName: "Ferreira",
    });
  });

  it("trims whitespace around given name and surname", () => {
    expect(parseFullName("  Alice  / Gonsalves /")).toEqual({ firstName: "Alice", lastName: "Gonsalves" });
  });

  it("returns fullName as firstName when no slashes present", () => {
    expect(parseFullName("Alice")).toEqual({ firstName: "Alice", lastName: null });
  });
});

// ── formatGedcomFullNameForDisplay ────────────────────────────────────────────

describe("formatGedcomFullNameForDisplay", () => {
  it("returns empty string for null", () => {
    expect(formatGedcomFullNameForDisplay(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatGedcomFullNameForDisplay(undefined)).toBe("");
  });

  it("replaces slashes with spaces and collapses whitespace", () => {
    expect(formatGedcomFullNameForDisplay("Alice /Gonsalves/")).toBe("Alice Gonsalves");
  });

  it("handles name with no slashes", () => {
    expect(formatGedcomFullNameForDisplay("Alice Gonsalves")).toBe("Alice Gonsalves");
  });

  it("collapses multiple spaces produced by slash removal", () => {
    expect(formatGedcomFullNameForDisplay("Augustinho Thomas / Gonsalves")).toBe("Augustinho Thomas Gonsalves");
  });

  it("trims leading and trailing whitespace", () => {
    expect(formatGedcomFullNameForDisplay("  Alice Gonsalves  ")).toBe("Alice Gonsalves");
  });
});

// ── formatGender ──────────────────────────────────────────────────────────────

describe("formatGender", () => {
  it("maps 'M' to 'Male'", () => {
    expect(formatGender("M", null)).toBe("Male");
  });

  it("maps 'F' to 'Female'", () => {
    expect(formatGender("F", null)).toBe("Female");
  });

  it("maps 'U' to 'Unknown'", () => {
    expect(formatGender("U", null)).toBe("Unknown");
  });

  it("maps 'X' to 'Other'", () => {
    expect(formatGender("X", null)).toBe("Other");
  });

  it("returns the raw sex value for unmapped codes", () => {
    expect(formatGender("Q", null)).toBe("Q");
  });

  it("falls back to gender string when sex is null", () => {
    expect(formatGender(null, "Non-binary")).toBe("Non-binary");
  });

  it("returns null when both sex and gender are null", () => {
    expect(formatGender(null, null)).toBeNull();
  });

  it("returns null when sex is null and gender is empty string", () => {
    expect(formatGender(null, "")).toBeNull();
  });

  it("sex takes precedence over gender", () => {
    expect(formatGender("M", "Male (from gender field)")).toBe("Male");
  });
});

// ── yearFromDisplayDateString ─────────────────────────────────────────────────

describe("yearFromDisplayDateString", () => {
  it("returns null for null input", () => {
    expect(yearFromDisplayDateString(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(yearFromDisplayDateString(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(yearFromDisplayDateString("")).toBeNull();
  });

  it("extracts year from 'DD MMM YYYY' format", () => {
    expect(yearFromDisplayDateString("15 Jan 1990")).toBe(1990);
  });

  it("extracts year from bare year string", () => {
    expect(yearFromDisplayDateString("1990")).toBe(1990);
  });

  it("returns null for strings without a recognizable year", () => {
    expect(yearFromDisplayDateString("Undated")).toBeNull();
    expect(yearFromDisplayDateString("ABT")).toBeNull();
  });

  it("handles years 1000-2029 (boundary of regex)", () => {
    expect(yearFromDisplayDateString("1 Jan 1000")).toBe(1000);
    expect(yearFromDisplayDateString("2029")).toBe(2029);
  });
});
