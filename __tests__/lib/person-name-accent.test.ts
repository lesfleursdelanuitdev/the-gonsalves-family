import { describe, expect, it } from "vitest";
import { getNameBackgroundColor } from "@/lib/person-name-accent";

const MALE = "#AAD7ED";
const FEMALE = "#F8BBD0";
const OTHER = "#C8E6C9";

describe("getNameBackgroundColor", () => {
  it("returns OTHER for null", () => {
    expect(getNameBackgroundColor(null)).toBe(OTHER);
  });

  it("returns OTHER for undefined", () => {
    expect(getNameBackgroundColor(undefined)).toBe(OTHER);
  });

  it("returns OTHER for empty string", () => {
    expect(getNameBackgroundColor("")).toBe(OTHER);
  });

  it("returns MALE for 'Male' (API label)", () => {
    expect(getNameBackgroundColor("Male")).toBe(MALE);
  });

  it("returns MALE for 'M' (GEDCOM letter)", () => {
    expect(getNameBackgroundColor("M")).toBe(MALE);
  });

  it("returns MALE case-insensitively", () => {
    expect(getNameBackgroundColor("male")).toBe(MALE);
    expect(getNameBackgroundColor("MALE")).toBe(MALE);
  });

  it("returns FEMALE for 'Female' (API label)", () => {
    expect(getNameBackgroundColor("Female")).toBe(FEMALE);
  });

  it("returns FEMALE for 'F' (GEDCOM letter)", () => {
    expect(getNameBackgroundColor("F")).toBe(FEMALE);
  });

  it("returns FEMALE case-insensitively", () => {
    expect(getNameBackgroundColor("female")).toBe(FEMALE);
  });

  it("returns OTHER for unknown gender strings", () => {
    expect(getNameBackgroundColor("Unknown")).toBe(OTHER);
    expect(getNameBackgroundColor("Other")).toBe(OTHER);
    expect(getNameBackgroundColor("X")).toBe(OTHER);
    expect(getNameBackgroundColor("nonbinary")).toBe(OTHER);
  });
});
