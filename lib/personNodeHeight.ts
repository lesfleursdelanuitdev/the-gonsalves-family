/**
 * Effective person node height from display settings.
 * Used so PersonNodeView and layout shrink when photo and/or dates are hidden.
 */

import { PERSON_HEIGHT } from "@/descendancy-chart";

/** Full height of a person card when photo and dates are shown. */
export const FULL_PERSON_HEIGHT = PERSON_HEIGHT;

/** Vertical space removed when "Show photos" is off (photo circle + gap below). Matches PersonNodeView layout. */
export const PHOTO_REGION_HEIGHT = 44 + 10; // 44px circle + 10px gap

/** Vertical space removed when "Show birth & death years" is off (gap + one line). Matches PersonNodeView layout. */
export const DATES_REGION_HEIGHT = 4 + 14; // gap + ~14px line (0.75rem)

export interface PersonHeightSettings {
  showPhotos?: boolean;
  showDates?: boolean;
}

/**
 * Returns the effective height of a person node given display settings.
 * Used by layout, bounds, connectors, and PersonNodeView so cards and spacing shrink when photo/dates are hidden.
 */
export function getEffectivePersonHeight(settings: PersonHeightSettings = {}): number {
  const showPhotos = settings.showPhotos !== false;
  const showDates = settings.showDates !== false;
  let height = FULL_PERSON_HEIGHT;
  if (!showPhotos) height -= PHOTO_REGION_HEIGHT;
  if (!showDates) height -= DATES_REGION_HEIGHT;
  return height;
}
