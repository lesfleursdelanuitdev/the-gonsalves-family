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
