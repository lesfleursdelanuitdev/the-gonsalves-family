import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";

export const UPCOMING_EVENT_TYPES = ["BIRT", "DEAT", "MARR"] as const;
export type UpcomingEventType = (typeof UPCOMING_EVENT_TYPES)[number];

export type UpcomingEventRow = {
  id: string;
  eventType: UpcomingEventType;
  eventLabel: string | null;
  date: {
    original: string | null;
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  place: { original: string | null; name: string | null } | null;
  individual: { id: string; xref: string; fullName: string } | null;
  family: {
    id: string;
    xref: string;
    husband: { id: string; xref: string; fullName: string } | null;
    wife: { id: string; xref: string; fullName: string } | null;
  } | null;
};

export type UpcomingEventsWindow = {
  start: { month: number; day: number };
  end: { month: number; day: number };
};

function monthDayOrdinal(month: number | null, day: number | null): number | null {
  if (month == null || day == null) return null;
  return month * 32 + day;
}

function ordinalInWindow(
  eventOrdinal: number | null,
  startOrdinal: number,
  endOrdinal: number,
): boolean {
  if (eventOrdinal == null) return false;
  if (startOrdinal <= endOrdinal) {
    return eventOrdinal >= startOrdinal && eventOrdinal <= endOrdinal;
  }
  return eventOrdinal >= startOrdinal || eventOrdinal <= endOrdinal;
}

export async function queryUpcomingEvents(): Promise<{
  window: UpcomingEventsWindow;
  events: UpcomingEventRow[];
} | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const now = new Date();
  const startMonth = now.getMonth() + 1;
  const startDay = now.getDate();
  const endDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();

  const startOrdinal = monthDayOrdinal(startMonth, startDay)!;
  const endOrdinal = monthDayOrdinal(endMonth, endDay)!;

  const rows = await prisma.gedcomEvent.findMany({
    where: {
      fileUuid,
      eventType: { in: [...UPCOMING_EVENT_TYPES] },
      dateId: { not: null },
    },
    select: {
      id: true,
      eventType: true,
      eventLabel: true,
      date: {
        select: {
          original: true,
          year: true,
          month: true,
          day: true,
        },
      },
      place: {
        select: { original: true, name: true },
      },
      individualEvents: {
        take: 1,
        select: {
          individual: {
            select: { id: true, xref: true, fullName: true },
          },
        },
      },
      familyEvents: {
        take: 1,
        select: {
          family: {
            select: {
              id: true,
              xref: true,
              husband: {
                select: { id: true, xref: true, fullName: true },
              },
              wife: {
                select: { id: true, xref: true, fullName: true },
              },
            },
          },
        },
      },
    },
  });

  const events = rows
    .filter((row) => {
      const ord = monthDayOrdinal(row.date?.month ?? null, row.date?.day ?? null);
      return ordinalInWindow(ord, startOrdinal, endOrdinal);
    })
    .map((row) => {
      const individual = row.individualEvents[0]?.individual;
      const family = row.familyEvents[0]?.family;
      return {
        id: row.id,
        eventType: row.eventType as UpcomingEventType,
        eventLabel: row.eventLabel ?? null,
        date: row.date
          ? {
              original: row.date.original,
              year: row.date.year,
              month: row.date.month,
              day: row.date.day,
            }
          : null,
        place: row.place
          ? { original: row.place.original, name: row.place.name }
          : null,
        individual: individual
          ? {
              id: individual.id,
              xref: individual.xref,
              fullName: individual.fullName ?? individual.xref,
            }
          : null,
        family: family
          ? {
              id: family.id,
              xref: family.xref,
              husband: family.husband
                ? {
                    id: family.husband.id,
                    xref: family.husband.xref,
                    fullName: family.husband.fullName ?? family.husband.xref,
                  }
                : null,
              wife: family.wife
                ? {
                    id: family.wife.id,
                    xref: family.wife.xref,
                    fullName: family.wife.fullName ?? family.wife.xref,
                  }
                : null,
            }
          : null,
      };
    })
    .sort((a, b) => {
      const m1 = a.date?.month ?? 99;
      const d1 = a.date?.day ?? 99;
      const m2 = b.date?.month ?? 99;
      const d2 = b.date?.day ?? 99;
      return m1 !== m2 ? m1 - m2 : d1 - d2;
    });

  return {
    window: {
      start: { month: startMonth, day: startDay },
      end: { month: endMonth, day: endDay },
    },
    events,
  };
}
