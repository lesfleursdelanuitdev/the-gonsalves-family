import type { FamiliesAsChildResponse } from "@/components/TreeViewer/v2/PersonDetailOverlay/types";
import { normalizeGedcomXref } from "@/components/TreeViewer/v2/PersonDetailOverlay/utils";

/**
 * Chooses root FAMC for initial pedigree render when the person has multiple child-families.
 * Prefers a family whose parent label indicates birth; otherwise the first family in API order.
 */
export function resolveDefaultRootPedigreeFamc(
  families: FamiliesAsChildResponse["familiesOfOrigin"]
): string | null {
  if (families.length === 0) return null;
  if (families.length === 1) {
    const x = families[0].family.xref;
    return x?.trim() ? normalizeGedcomXref(x) : null;
  }
  const birth = families.find((f) => /\bbirth\b/i.test(f.parentsLabel ?? ""));
  const chosen = birth ?? families[0];
  const x = chosen.family.xref;
  return x?.trim() ? normalizeGedcomXref(x) : null;
}
