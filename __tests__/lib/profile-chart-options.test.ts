import { describe, expect, it } from "vitest";
import { profileChartOpenLabel, profileChartPersonLabel } from "@/lib/profile-chart-copy";

describe("profileChartPersonLabel", () => {
  it("uses the first given name", () => {
    expect(profileChartPersonLabel("Maria Elena Gonsalves")).toBe("Maria");
  });
});

describe("profileChartOpenLabel", () => {
  it("names the person in the CTA", () => {
    expect(profileChartOpenLabel("pedigree", "Ada Lovelace")).toBe("Open Ada's pedigree");
  });
});
