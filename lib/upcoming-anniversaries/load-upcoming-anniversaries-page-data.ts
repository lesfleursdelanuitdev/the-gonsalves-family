import { loadPublicFamiliesByIds } from "@/lib/families/load-public-families";
import { loadPublicIndividualsByIds } from "@/lib/individuals/load-public-individuals";
import { loadIndividualPrivacyHintsByIds } from "@/lib/individuals/load-individual-living-status";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import {
  collectUpcomingEventIndividualIds,
  redactPublicFamilyForAnniversaryViewer,
  redactUpcomingAnniversaryMonthGroupsForViewer,
} from "./apply-upcoming-anniversary-living-privacy";
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

  const viewer = await resolvePublicViewer();
  const privacyIds = collectUpcomingEventIndividualIds(result.events);
  const hints = await loadIndividualPrivacyHintsByIds(privacyIds);

  const [people, familiesRaw] = await Promise.all([
    loadPublicIndividualsByIds(individualIds),
    loadPublicFamiliesByIds(familyIds),
  ]);

  const families = familiesRaw.map((family) =>
    redactPublicFamilyForAnniversaryViewer(family, viewer, hints),
  );

  const monthGroups = redactUpcomingAnniversaryMonthGroupsForViewer(
    buildUpcomingAnniversaryGroups({
      window: result.window,
      events: result.events,
      peopleById: new Map(people.map((p) => [p.id, p])),
      familiesById: new Map(families.map((f) => [f.id, f])),
    }),
    viewer,
    hints,
  );

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
