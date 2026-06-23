import { describe, expect, it } from "vitest";
import { mergeStatSlicesByLabel } from "@/lib/home-stat-slices";

describe("mergeStatSlicesByLabel", () => {
  it("sums duplicate labels and sorts by value", () => {
    expect(
      mergeStatSlicesByLabel([
        { label: "Guyana", value: 35 },
        { label: "Canada", value: 49 },
        { label: "Guyana", value: 18 },
        { label: "Essequibo, Guyana", value: 25 },
        { label: "Essequibo, Guyana", value: 20 },
      ]),
    ).toEqual([
      { label: "Guyana", value: 53 },
      { label: "Canada", value: 49 },
      { label: "Essequibo, Guyana", value: 45 },
    ]);
  });

  it("respects max after merge", () => {
    expect(
      mergeStatSlicesByLabel(
        [
          { label: "A", value: 10 },
          { label: "B", value: 5 },
          { label: "A", value: 1 },
        ],
        1,
      ),
    ).toEqual([{ label: "A", value: 11 }]);
  });
});
