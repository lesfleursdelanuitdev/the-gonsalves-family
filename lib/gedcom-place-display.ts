/**
 * Build a full place line from {@link GedcomPlace} (schema: name, county, state, country, original).
 * Denormalized `*_place_display` on individuals is often a single segment; the linked row has full hierarchy.
 *
 * When a GedcomPlace is linked to a ResolvedPlace (via resolvedLink), the resolved displayName is
 * preferred as the canonical label and the resolved coordinates are preferred for maps.
 *
 * The label-building logic itself lives in `@ligneous/gedcom-events` ({@link fullPlaceLabel}) so every
 * repo formats places identically — see the "Full place names" rule in the workspace CLAUDE.md.
 */

import { fullPlaceLabel } from "@ligneous/gedcom-events";

export const GEDCOM_PLACE_DISPLAY_SELECT = {
  original: true,
  name: true,
  county: true,
  state: true,
  country: true,
  resolvedLink: {
    select: {
      resolvedPlace: {
        select: {
          displayName: true,
          // Required: fullPlaceLabel only uses displayName when status is "active".
          status: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  },
} as const;

export type GedcomPlaceDisplayRow = {
  original: string;
  name: string | null;
  county: string | null;
  state: string | null;
  country: string | null;
  /** Present when the GedcomPlace has been resolved to a canonical ResolvedPlace. */
  resolvedLink?: {
    resolvedPlace: { displayName: string; status: string; latitude: unknown; longitude: unknown };
  } | null;
};

/**
 * Prefer the curated ResolvedPlace displayName when available.
 * Falls back to comma-joined structured fields, then `original` PLAC text.
 *
 * Thin wrapper over the shared {@link fullPlaceLabel} so this app's existing call
 * sites keep working while the logic stays in one place.
 */
export function fullPlaceLabelFromGedcomPlace(
  place: GedcomPlaceDisplayRow | null | undefined
): string | null {
  return fullPlaceLabel(place);
}

/** Include on `GedcomIndividual` Prisma `select` so {@link mapIndividualRow} can build full place lines. */
export const individualBirthDeathPlaceSelect = {
  birthPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
  deathPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
} as const;
