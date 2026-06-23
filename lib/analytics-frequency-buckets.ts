/** Aligns with ligneous-python-api analytics bucket logic for name/surname frequency histograms. */

export type FrequencyBucket = { bucket: string; count: number };

const BUCKET_ORDER = ["1", "2-5", "6-10", "11-25", "26-50", "50+"];

export function bucketByOccurrenceCount(f: number): string {
  if (f === 1) return "1";
  if (f >= 2 && f < 6) return "2-5";
  if (f >= 6 && f <= 10) return "6-10";
  if (f >= 11 && f <= 25) return "11-25";
  if (f >= 26 && f <= 50) return "26-50";
  return "50+";
}

/** Human-readable bucket label for charts (how often a name appears in the tree). */
export function formatFrequencyBucketDisplayLabel(bucket: string): string {
  switch (bucket) {
    case "1":
      return "Used once";
    case "2-5":
      return "Used 2–5 times";
    case "6-10":
      return "Used 6–10 times";
    case "11-25":
      return "Used 11–25 times";
    case "26-50":
      return "Used 26–50 times";
    case "50+":
      return "Used 50+ times";
    default:
      return bucket;
  }
}

export function frequencyDistributionFromOccurrences(freqs: number[]): FrequencyBucket[] {
  const counts = new Map<string, number>();
  for (const f of freqs) {
    const b = bucketByOccurrenceCount(f);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  return BUCKET_ORDER.filter((b) => (counts.get(b) ?? 0) > 0).map((bucket) => ({
    bucket,
    count: counts.get(bucket) ?? 0,
  }));
}
