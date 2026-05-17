import type { FamiliesFilterState } from "@/components/families/FamiliesFilterPanel";
import type { PublicFamily } from "@/components/families/types";

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesRange(value: number | null, min: number | null, max: number | null): boolean {
  if (min == null && max == null) return true;
  if (value == null) return false;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

function hasMarriageDate(family: PublicFamily): boolean {
  return family.marriageYear != null || Boolean(family.marriageDateLabel?.trim());
}

export function filterPublicFamilies(families: PublicFamily[], filters: FamiliesFilterState): PublicFamily[] {
  const minChildren = parseNumber(filters.minChildren);
  const maxChildren = parseNumber(filters.maxChildren);
  const minMarriageYear = parseNumber(filters.minMarriageYear);
  const maxMarriageYear = parseNumber(filters.maxMarriageYear);
  const hasChildrenRange = minChildren != null || maxChildren != null;
  const hasMarriageYearRange = minMarriageYear != null || maxMarriageYear != null;

  return families.filter((family) => {
    if (filters.hasChildren === "yes" && family.childrenCount === 0) return false;
    if (filters.hasChildren === "no" && family.childrenCount > 0) return false;

    const marriageRecorded = hasMarriageDate(family);
    if (filters.hasMarriageDate === "yes" && !marriageRecorded) return false;
    if (filters.hasMarriageDate === "no" && marriageRecorded) return false;

    if (filters.divorced !== "all" && family.divorcedStatus !== filters.divorced) return false;

    if (hasChildrenRange && !matchesRange(family.childrenCount, minChildren, maxChildren)) return false;

    if (hasMarriageYearRange && !matchesRange(family.marriageYear, minMarriageYear, maxMarriageYear)) return false;

    return true;
  });
}
