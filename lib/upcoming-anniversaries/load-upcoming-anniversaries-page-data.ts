import { loadPublicFamiliesByIds } from "@/lib/families/load-public-families";
import { loadPublicIndividualsByIds } from "@/lib/individuals/load-public-individuals";
import {
  buildUpcomingAnniversaryGroups,
  formatUpcomingWindowRange,
  type UpcomingAnniversaryMonthGroup,
} from "./group-upcoming-anniversaries";
import { queryUpcomingEvents, type UpcomingEventsWindow } from "./query-upcoming-events";

export type UpcomingAnniversariesPageData = {
  window: UpcomingEventsWindow;
  windowLabel: string;
  monthGroups: UpcomingAnniversaryMonthGroup[];
  totalCount: number;
};

export async function loadUpcomingAnniversariesPageData(): Promise<UpcomingAnniversariesPageData | null> {
  const result = await queryUpcomingEvents();
  if (!result) return null;

  const individualIds = [
    ...new Set(
      result.events
        .filter((e) => e.eventType === "BIRT" || e.eventType === "DEAT")
        .map((e) => e.individual?.id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const familyIds = [
    ...new Set(
      result.events
        .filter((e) => e.eventType === "MARR")
        .map((e) => e.family?.id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [people, families] = await Promise.all([
    loadPublicIndividualsByIds(individualIds),
    loadPublicFamiliesByIds(familyIds),
  ]);

  const monthGroups = buildUpcomingAnniversaryGroups({
    window: result.window,
    events: result.events,
    peopleById: new Map(people.map((p) => [p.id, p])),
    familiesById: new Map(families.map((f) => [f.id, f])),
  });

  return {
    window: result.window,
    windowLabel: formatUpcomingWindowRange(result.window),
    monthGroups,
    totalCount: monthGroups.reduce(
      (sum, g) => sum + g.sections.reduce((s, sec) => s + sec.items.length, 0),
      0,
    ),
  };
}
