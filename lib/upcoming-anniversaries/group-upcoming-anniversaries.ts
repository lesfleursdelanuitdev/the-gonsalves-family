import type { PublicFamily } from "@/components/families/types";
import type { PublicIndividual } from "@/components/individuals/types";
import type { UpcomingEventRow, UpcomingEventType, UpcomingEventsWindow } from "./query-upcoming-events";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const SECTION_ORDER: UpcomingEventType[] = ["BIRT", "DEAT", "MARR"];

const SECTION_LABELS: Record<UpcomingEventType, string> = {
  BIRT: "Birthdays",
  DEAT: "Death anniversaries",
  MARR: "Marriage anniversaries",
};

export type UpcomingAnniversaryPersonItem = {
  kind: "person";
  eventId: string;
  eventType: "BIRT" | "DEAT";
  occasionTitle: string;
  occasionSubtitle: string;
  calendarMonth: number;
  calendarDay: number | null;
  calendarDayLabel: string;
  person: PublicIndividual;
};

export type UpcomingAnniversaryFamilyItem = {
  kind: "family";
  eventId: string;
  eventType: "MARR";
  occasionTitle: string;
  occasionSubtitle: string;
  calendarMonth: number;
  calendarDay: number | null;
  calendarDayLabel: string;
  family: PublicFamily;
};

export type UpcomingAnniversaryItem = UpcomingAnniversaryPersonItem | UpcomingAnniversaryFamilyItem;

export type UpcomingAnniversaryMonthGroup = {
  month: number;
  monthLabel: string;
  sections: Array<{
    eventType: UpcomingEventType;
    label: string;
    items: UpcomingAnniversaryItem[];
  }>;
};

function monthLabel(month: number, referenceYear: number, window: UpcomingEventsWindow): string {
  const name = MONTH_NAMES[month - 1] ?? `Month ${month}`;
  if (window.start.month > window.end.month && month < window.start.month) {
    return `${name} ${referenceYear + 1}`;
  }
  return `${name} ${referenceYear}`;
}

function sortMonthsInWindow(months: number[], startMonth: number): number[] {
  return [...new Set(months)].sort((a, b) => {
    const ord = (m: number) => (m >= startMonth ? m : m + 12);
    return ord(a) - ord(b);
  });
}

function calendarDayLabel(month: number | null, day: number | null, original: string | null): string {
  if (month != null && day != null) {
    return `${MONTH_NAMES[month - 1] ?? month} ${day}`;
  }
  return original?.trim() || "Date unknown";
}

function anniversarySubtitle(
  eventType: UpcomingEventType,
  eventYear: number | null,
  referenceYear: number,
): string {
  if (eventYear == null) {
    if (eventType === "BIRT") return "Birthday";
    if (eventType === "DEAT") return "Day of remembrance";
    return "Wedding anniversary";
  }
  const years = referenceYear - eventYear;
  if (years < 0) return "";
  if (eventType === "BIRT") {
    return years === 0 ? "Born this year" : `Turning ${years + 1}`;
  }
  if (years === 0) return "First anniversary";
  if (years === 1) return "1 year";
  return `${years} years`;
}

function occasionTitle(eventType: UpcomingEventType): string {
  if (eventType === "BIRT") return "Birthday";
  if (eventType === "DEAT") return "Death anniversary";
  return "Marriage anniversary";
}

export function buildUpcomingAnniversaryGroups(args: {
  window: UpcomingEventsWindow;
  events: UpcomingEventRow[];
  peopleById: Map<string, PublicIndividual>;
  familiesById: Map<string, PublicFamily>;
}): UpcomingAnniversaryMonthGroup[] {
  const referenceYear = new Date().getFullYear();
  const items: Array<UpcomingAnniversaryItem & { month: number; sortDay: number }> = [];

  for (const ev of args.events) {
    const month = ev.date?.month;
    const calendarDay = ev.date?.day ?? null;
    const day = calendarDay ?? 32;
    if (month == null) continue;

    const calLabel = calendarDayLabel(month, calendarDay, ev.date?.original ?? null);
    const subtitle = anniversarySubtitle(ev.eventType, ev.date?.year ?? null, referenceYear);
    const title = occasionTitle(ev.eventType);

    if (ev.eventType === "MARR" && ev.family) {
      const family = args.familiesById.get(ev.family.id);
      if (!family) continue;
      items.push({
        kind: "family",
        eventId: ev.id,
        eventType: "MARR",
        occasionTitle: title,
        occasionSubtitle: subtitle,
        calendarMonth: month,
        calendarDay,
        calendarDayLabel: calLabel,
        family,
        month,
        sortDay: day,
      });
      continue;
    }

    if ((ev.eventType === "BIRT" || ev.eventType === "DEAT") && ev.individual) {
      const person = args.peopleById.get(ev.individual.id);
      if (!person) continue;
      items.push({
        kind: "person",
        eventId: ev.id,
        eventType: ev.eventType,
        occasionTitle: title,
        occasionSubtitle: subtitle,
        calendarMonth: month,
        calendarDay,
        calendarDayLabel: calLabel,
        person,
        month,
        sortDay: day,
      });
    }
  }

  const months = sortMonthsInWindow(
    items.map((i) => i.month),
    args.window.start.month,
  );

  return months.map((month) => {
    const monthItems = items
      .filter((i) => i.month === month)
      .sort((a, b) => a.sortDay - b.sortDay || a.occasionTitle.localeCompare(b.occasionTitle));

    const sections = SECTION_ORDER.map((eventType) => {
      const sectionItems = monthItems
        .filter((i) => i.eventType === eventType)
        .map(({ month: _m, sortDay: _d, ...rest }) => rest);
      return {
        eventType,
        label: SECTION_LABELS[eventType],
        items: sectionItems,
      };
    }).filter((s) => s.items.length > 0);

    return {
      month,
      monthLabel: monthLabel(month, referenceYear, args.window),
      sections,
    };
  });
}

export function formatUpcomingWindowRange(window: UpcomingEventsWindow): string {
  const fmt = (m: number, d: number) => `${m}/${d}`;
  return `${fmt(window.start.month, window.start.day)} – ${fmt(window.end.month, window.end.day)}`;
}
