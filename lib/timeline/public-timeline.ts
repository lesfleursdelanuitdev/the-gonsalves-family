import {
  fullPlaceLabelFromGedcomPlace,
  type GedcomPlaceDisplayRow,
} from "@/lib/gedcom-place-display";

export type PublicProfileTimelineItem = {
  id: string;
  dateLabel: string;
  title: string;
  place: string | null;
  description: string;
  context: string;
};

export type TimelineBuildItem = PublicProfileTimelineItem & {
  eventId: string;
  sortYear: number | null;
  sortMonth: number;
  sortDay: number;
  sortPriority: number;
};

export function eventTitle(eventType: string | null | undefined, customType: string | null | undefined): string {
  const type = (eventType ?? "").toUpperCase();
  if (type === "BIRT") return "Birth";
  if (type === "DEAT") return "Death";
  if (type === "MARR") return "Marriage";
  if (type === "BURI") return "Burial";
  if (type === "RESI") return "Residence";
  if (type === "OCCU") return "Occupation";
  if (type === "IMMI") return "Immigration";
  if (type === "EMIG") return "Emigration";
  if (type === "DIV") return "Divorce";
  if (type === "ANUL") return "Annulment";
  return customType?.trim() || eventType || "Life event";
}

export function dateLabelFromParts(original: string | null | undefined, year: number | null | undefined): string {
  return original?.trim() || (year != null ? String(year) : "Undated");
}

export function fullPlaceLabel(
  place: GedcomPlaceDisplayRow | null | undefined,
  displayFallback?: string | null,
): string | null {
  return fullPlaceLabelFromGedcomPlace(place) ?? (displayFallback?.trim() || null);
}

export function isPrimaryTimelineContext(context: string): boolean {
  return context === "Personal event" || context === "Family event";
}

export function sortTimeline(items: TimelineBuildItem[]): PublicProfileTimelineItem[] {
  return items
    .sort((a, b) => {
      const yearA = a.sortYear ?? Number.POSITIVE_INFINITY;
      const yearB = b.sortYear ?? Number.POSITIVE_INFINITY;
      if (yearA !== yearB) return yearA - yearB;
      if (a.sortMonth !== b.sortMonth) return a.sortMonth - b.sortMonth;
      if (a.sortDay !== b.sortDay) return a.sortDay - b.sortDay;
      return a.sortPriority - b.sortPriority;
    })
    .map((item) => ({
      id: item.id,
      dateLabel: item.dateLabel,
      title: item.title,
      place: item.place,
      description: item.description,
      context: item.context,
    }));
}

/** When the same GEDCOM event is linked to the family and a member, keep one row (prefer family context). */
export function dedupeTimelineByEventId(items: TimelineBuildItem[]): TimelineBuildItem[] {
  const seen = new Map<string, TimelineBuildItem>();
  for (const item of items) {
    const existing = seen.get(item.eventId);
    if (!existing) {
      seen.set(item.eventId, item);
      continue;
    }
    if (item.context === "Family event" && existing.context !== "Family event") {
      seen.set(item.eventId, item);
    }
  }
  return [...seen.values()];
}

export const GEDCOM_EVENT_TIMELINE_SELECT = {
  id: true,
  eventType: true,
  customType: true,
  value: true,
  date: { select: { original: true, year: true, month: true, day: true } },
  place: { select: { id: true, name: true, county: true, state: true, country: true, original: true } },
} as const;
