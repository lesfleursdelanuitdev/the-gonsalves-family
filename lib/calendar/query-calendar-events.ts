import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";

export type CalendarEventType = "BIRT" | "DEAT" | "MARR";

export interface CalendarEvent {
  id: string;
  eventType: CalendarEventType;
  year: number | null;
  displayName: string;
  profileHref: string;
}

/** Returns events grouped by day-of-month (1–31) for the given month (1–12). */
export async function queryCalendarEvents(
  month: number,
): Promise<Record<number, CalendarEvent[]> | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const rows = await prisma.gedcomEvent.findMany({
    where: {
      fileUuid,
      eventType: { in: ["BIRT", "DEAT", "MARR"] },
      dateId: { not: null },
      date: { month },
    },
    select: {
      id: true,
      eventType: true,
      date: { select: { year: true, day: true } },
      individualEvents: {
        take: 1,
        select: {
          individual: { select: { id: true, xref: true, fullName: true } },
        },
      },
      familyEvents: {
        take: 1,
        select: {
          family: {
            select: {
              id: true,
              xref: true,
              husband: { select: { id: true, xref: true, fullName: true } },
              wife: { select: { id: true, xref: true, fullName: true } },
            },
          },
        },
      },
    },
  });

  const byDay: Record<number, CalendarEvent[]> = {};

  for (const row of rows) {
    const day = row.date?.day;
    if (!day) continue;

    const individual = row.individualEvents[0]?.individual;
    const family = row.familyEvents[0]?.family;

    let displayName: string;
    let profileHref: string;

    if (individual) {
      displayName = formatGedcomFullNameForDisplay(individual.fullName ?? individual.xref);
      profileHref = `/individuals/${individual.id}`;
    } else if (family) {
      const h = formatGedcomFullNameForDisplay(family.husband?.fullName ?? family.husband?.xref ?? null);
      const w = formatGedcomFullNameForDisplay(family.wife?.fullName ?? family.wife?.xref ?? null);
      displayName = h && w ? `${h} & ${w}` : h || w || family.xref;
      profileHref = `/families/${family.id}`;
    } else {
      continue;
    }

    if (!byDay[day]) byDay[day] = [];
    byDay[day].push({
      id: row.id,
      eventType: row.eventType as CalendarEventType,
      year: row.date?.year ?? null,
      displayName,
      profileHref,
    });
  }

  // Sort each day's events: BIRT first, MARR second, DEAT last; then alphabetically
  const ORDER: Record<CalendarEventType, number> = { BIRT: 0, MARR: 1, DEAT: 2 };
  for (const events of Object.values(byDay)) {
    events.sort(
      (a, b) =>
        ORDER[a.eventType] - ORDER[b.eventType] ||
        a.displayName.localeCompare(b.displayName),
    );
  }

  return byDay;
}
