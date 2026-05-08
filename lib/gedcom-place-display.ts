/**
 * Build a full place line from {@link GedcomPlace} (schema: name, county, state, country, original).
 * Denormalized `*_place_display` on individuals is often a single segment; the linked row has full hierarchy.
 */

export const GEDCOM_PLACE_DISPLAY_SELECT = {
  original: true,
  name: true,
  county: true,
  state: true,
  country: true,
} as const;

export type GedcomPlaceDisplayRow = {
  original: string;
  name: string | null;
  county: string | null;
  state: string | null;
  country: string | null;
};

/**
 * Prefer comma-joined structured fields (locality → county → region → country).
 * If those are empty, use `original` (full PLAC text from the GEDCOM file).
 */
export function fullPlaceLabelFromGedcomPlace(
  place: GedcomPlaceDisplayRow | null | undefined
): string | null {
  if (!place) return null;
  const parts = [place.name, place.county, place.state, place.country]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s): s is string => s.length > 0);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of parts) {
    const k = p.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(p);
  }
  const structured = unique.length > 0 ? unique.join(", ") : "";
  const orig = place.original?.trim() ?? "";

  const segmentCount = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean).length;

  if (orig && structured) {
    return segmentCount(orig) > segmentCount(structured) ? orig : structured;
  }
  if (structured) return structured;
  return orig.length > 0 ? orig : null;
}

/** Include on `GedcomIndividual` Prisma `select` so {@link mapIndividualRow} can build full place lines. */
export const individualBirthDeathPlaceSelect = {
  birthPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
  deathPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
} as const;
