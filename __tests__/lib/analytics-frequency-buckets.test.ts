import { describe, expect, it } from "vitest";
import {
  bucketByOccurrenceCount,
  frequencyDistributionFromOccurrences,
} from "@/lib/analytics-frequency-buckets";

describe("bucketByOccurrenceCount", () => {
  it("buckets exactly 1 into '1'", () => {
    expect(bucketByOccurrenceCount(1)).toBe("1");
  });

  it("buckets 2-5 into '2-5'", () => {
    expect(bucketByOccurrenceCount(2)).toBe("2-5");
    expect(bucketByOccurrenceCount(5)).toBe("2-5");
  });

  it("buckets 6-10 into '6-10'", () => {
    expect(bucketByOccurrenceCount(6)).toBe("6-10");
    expect(bucketByOccurrenceCount(10)).toBe("6-10");
  });

  it("buckets 11-25 into '11-25'", () => {
    expect(bucketByOccurrenceCount(11)).toBe("11-25");
    expect(bucketByOccurrenceCount(25)).toBe("11-25");
  });

  it("buckets 26-50 into '26-50'", () => {
    expect(bucketByOccurrenceCount(26)).toBe("26-50");
    expect(bucketByOccurrenceCount(50)).toBe("26-50");
  });

  it("buckets 51+ into '50+'", () => {
    expect(bucketByOccurrenceCount(51)).toBe("50+");
    expect(bucketByOccurrenceCount(1000)).toBe("50+");
  });
});

describe("frequencyDistributionFromOccurrences", () => {
  it("returns empty array for empty input", () => {
    expect(frequencyDistributionFromOccurrences([])).toEqual([]);
  });

  it("returns a single bucket for uniform input", () => {
    const result = frequencyDistributionFromOccurrences([1, 1, 1]);
    expect(result).toEqual([{ bucket: "1", count: 3 }]);
  });

  it("returns multiple buckets in BUCKET_ORDER order", () => {
    const result = frequencyDistributionFromOccurrences([1, 3, 7, 20, 30, 60]);
    expect(result.map((b) => b.bucket)).toEqual(["1", "2-5", "6-10", "11-25", "26-50", "50+"]);
  });

  it("omits buckets with zero count", () => {
    // Only 1s and 50+ — 2-5 through 26-50 omitted
    const result = frequencyDistributionFromOccurrences([1, 100]);
    expect(result.map((b) => b.bucket)).toEqual(["1", "50+"]);
  });

  it("counts correctly across buckets", () => {
    // 2 in '1', 3 in '2-5'
    const result = frequencyDistributionFromOccurrences([1, 1, 2, 3, 4]);
    expect(result).toEqual([
      { bucket: "1", count: 2 },
      { bucket: "2-5", count: 3 },
    ]);
  });
});
