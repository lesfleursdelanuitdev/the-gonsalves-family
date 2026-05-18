import { describe, expect, it } from "vitest";
import {
  profileChartDescription,
  profileChartOpenLabel,
  profileChartPersonLabel,
} from "@/lib/profile-chart-copy";

describe("profileChartPersonLabel", () => {
  it("uses the first given name", () => {
    expect(profileChartPersonLabel("Maria Elena Gonsalves")).toBe("Maria");
  });
});

describe("profileChartDescription", () => {
  it("includes the person's name", () => {
    expect(profileChartDescription("descendancy", "John Smith")).toContain("John");
    expect(profileChartDescription("fan_chart", "John Smith")).toContain("John");
  });
});

describe("profileChartOpenLabel", () => {
  it("names the person in the CTA", () => {
    expect(profileChartOpenLabel("pedigree", "Ada Lovelace")).toBe("Open Ada's pedigree");
  });
});
