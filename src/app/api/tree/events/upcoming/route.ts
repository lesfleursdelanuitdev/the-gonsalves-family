import { NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";

const EVENT_TYPES = ["BIRT", "DEAT", "MARR"] as const;

/** Ordinal for (month, day) so we can compare and handle year wrap. month 1-12, day 1-31. */
function monthDayOrdinal(month: number | null, day: number | null): number | null {
  if (month == null || day == null) return null;
  return month * 32 + day;
}

/** Whether (month, day) falls inside [startOrdinal, endOrdinal], with wrap (e.g. Dec 20 – Mar 20). */
function ordinalInWindow(
  eventOrdinal: number | null,
  startOrdinal: number,
  endOrdinal: number
): boolean {
  if (eventOrdinal == null) return false;
  if (startOrdinal <= endOrdinal) {
    return eventOrdinal >= startOrdinal && eventOrdinal <= endOrdinal;
  }
  return eventOrdinal >= startOrdinal || eventOrdinal <= endOrdinal;
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

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
        eventType: { in: [...EVENT_TYPES] },
        dateId: { not: null },
      },
      select: {
        id: true,
        eventType: true,
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
              select: { xref: true, fullName: true },
            },
          },
        },
        familyEvents: {
          take: 1,
          select: {
            family: {
              select: {
                husband: {
                  select: { xref: true, fullName: true },
                },
                wife: {
                  select: { xref: true, fullName: true },
                },
              },
            },
          },
        },
      },
    });

    const mapped = rows
      .filter((row) => {
        const ord = monthDayOrdinal(row.date?.month ?? null, row.date?.day ?? null);
        return ordinalInWindow(ord, startOrdinal, endOrdinal);
      })
      .map((row) => {
        const individual = row.individualEvents[0]?.individual;
        const family = row.familyEvents[0]?.family;
        return {
          eventType: row.eventType,
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
          ...(individual && { individual: { xref: individual.xref, fullName: individual.fullName } }),
          ...(family && {
            family: {
              husband: family.husband
                ? { xref: family.husband.xref, fullName: family.husband.fullName }
                : null,
              wife: family.wife
                ? { xref: family.wife.xref, fullName: family.wife.fullName }
                : null,
            },
          }),
        };
      });

    const events = mapped.slice().sort((a, b) => {
      const m1 = a.date?.month ?? 99;
      const d1 = a.date?.day ?? 99;
      const m2 = b.date?.month ?? 99;
      const d2 = b.date?.day ?? 99;
      return m1 !== m2 ? m1 - m2 : d1 - d2;
    });

    return NextResponse.json({
      window: {
        start: { month: startMonth, day: startDay },
        end: { month: endMonth, day: endDay },
      },
      events,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
