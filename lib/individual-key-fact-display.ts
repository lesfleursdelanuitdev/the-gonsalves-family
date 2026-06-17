/**
 * Derive display strings from SQL rows that join gedcom_events_v2 + dates + places.
 * Prefer these over gedcom_individuals_v2 birth_* / death_* columns when both exist,
 * so UI matches the canonical BIRT/DEAT event after admin edits.
 */

import { formatGedcomDateDisplayLabel } from "@ligneous/gedcom-dates";
import { fullPlaceLabel } from "@ligneous/gedcom-events";

type EventJoinRow = Record<string, unknown> | undefined;

export function dateDisplayFromJoinedEventRow(row: EventJoinRow): string | null {
  if (!row) return null;
  const orig = typeof row.date_original === "string" ? row.date_original.trim() : "";
  const y = row.year as number | null | undefined;
  const m = row.month as number | null | undefined;
  const d = row.day as number | null | undefined;
  if (!orig && y == null && m == null && d == null) return null;
  const dateType =
    row.date_type != null && String(row.date_type).trim() ? String(row.date_type) : "EXACT";
  const label = formatGedcomDateDisplayLabel({
    original: orig || null,
    dateType,
    year: y ?? null,
    month: m ?? null,
    day: d ?? null,
  });
  return label.trim() ? label : null;
}

export function placeDisplayFromJoinedEventRow(row: EventJoinRow): string | null {
  if (!row) return null;
  // Always show the full place name, never the single-segment `place_name`.
  return fullPlaceLabel({
    original: row.place_original as string | null | undefined,
    name: row.place_name as string | null | undefined,
  });
}
