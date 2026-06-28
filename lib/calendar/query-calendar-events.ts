import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import { resolveEventPrimaryParticipants } from "@ligneous/gedcom-events";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { isAuthenticatedViewer } from "@/lib/auth/public-viewer";
import { formatMinimalLivingLabel } from "@/lib/auth/living-person-privacy";
import {
  buildCalendarFamilyEvent,
  buildCalendarIndividualEvent,
} from "@/lib/calendar/apply-calendar-living-privacy";

export type CalendarEventType = "BIRT" | "DEAT" | "MARR";

export interface CalendarEvent {
  id: string;
  eventType: CalendarEventType;
  year: number | null;
  displayName: string;
  profileHref: string;
  privacyRestricted?: boolean;
  loginHref?: string | null;
}

/** Returns events grouped by day-of-month (1–31) for the given month (1–12). */
export async function queryCalendarEvents(
  month: number,
): Promise<Record<number, CalendarEvent[]> | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const viewer = await resolvePublicViewer();

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
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          participantKind: true,
          role: true,
          sortOrder: true,
          individual: { select: { id: true, xref: true, fullName: true, isLiving: true, birthYear: true } },
        },
      },
      familyEvents: {
        take: 1,
        select: {
          family: {
            select: {
              id: true,
              xref: true,
              husband: { select: { id: true, xref: true, fullName: true, isLiving: true, birthYear: true } },
              wife: { select: { id: true, xref: true, fullName: true, isLiving: true, birthYear: true } },
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

    const resolved = resolveEventPrimaryParticipants({
      individualEvents: row.individualEvents,
      familyEvents: row.familyEvents,
    });
    const family = row.familyEvents[0]?.family;

    if (resolved.source === "family-partners" && family) {
      const h = formatGedcomFullNameForDisplay(family.husband?.fullName ?? family.husband?.xref ?? null);
      const w = formatGedcomFullNameForDisplay(family.wife?.fullName ?? family.wife?.xref ?? null);
      const anonymous = !isAuthenticatedViewer(viewer);
      const hDisplay =
        anonymous && family.husband?.isLiving
          ? formatMinimalLivingLabel(h, family.husband.birthYear ?? null)
          : h;
      const wDisplay =
        anonymous && family.wife?.isLiving
          ? formatMinimalLivingLabel(w, family.wife?.birthYear ?? null)
          : w;
      const displayName = hDisplay && wDisplay ? `${hDisplay} & ${wDisplay}` : hDisplay || wDisplay || family.xref;
      const profileHref = `/families/${family.id}`;
      const hasLivingPartner = Boolean(family.husband?.isLiving || family.wife?.isLiving);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(
        buildCalendarFamilyEvent({
          id: family.id,
          displayName,
          profileHref,
          eventType: row.eventType as CalendarEventType,
          year: row.date?.year ?? null,
          eventId: row.id,
          hasLivingPartner,
          viewer,
        }),
      );
      continue;
    }

    if (resolved.individuals[0]) {
      const primaryId = resolved.individuals[0].id;
      const primaryRow = row.individualEvents.find((link) => link.individual.id === primaryId)?.individual;
      if (!primaryRow) continue;

      const displayName = formatGedcomFullNameForDisplay(primaryRow.fullName ?? primaryRow.xref);
      const profileHref = `/individuals/${primaryRow.id}`;
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(
        buildCalendarIndividualEvent({
          id: primaryRow.id,
          displayName,
          birthYear: primaryRow.birthYear ?? null,
          isLiving: primaryRow.isLiving,
          profileHref,
          eventType: row.eventType as CalendarEventType,
          year: row.date?.year ?? null,
          eventId: row.id,
          viewer,
        }),
      );
    }
  }

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
