import type { HomeStatSlice } from "@/types/tree";

/** Sum values that share the same display label (e.g. distinct place rows → one "Guyana"). */
export function mergeStatSlicesByLabel(slices: HomeStatSlice[], max?: number): HomeStatSlice[] {
  const byLabel = new Map<string, number>();
  for (const slice of slices) {
    const label = slice.label.trim();
    if (!label) continue;
    byLabel.set(label, (byLabel.get(label) ?? 0) + slice.value);
  }
  const merged = [...byLabel.entries()]
    .map(([label, value]) => ({ label, value }))
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);
  return max != null ? merged.slice(0, max) : merged;
}
