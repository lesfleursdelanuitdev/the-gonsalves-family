import { prisma } from "@/lib/database/prisma";
import type { PublicViewer } from "@/lib/auth/public-viewer-context";
import {
  applyLivingPrivacyToTimelineItem,
  loadEventLivingLinksByIds,
} from "@/lib/events/map-event-living-privacy";
import {
  GEDCOM_PLACE_DISPLAY_SELECT,
  type GedcomPlaceDisplayRow,
} from "@/lib/gedcom-place-display";
import {
  dateLabelFromParts,
  dedupeTimelineByEventId,
  eventTitle,
  fullPlaceLabel,
  GEDCOM_EVENT_TIMELINE_SELECT,
  sortTimeline,
  type PublicProfileTimelineItem,
  type TimelineBuildItem,
} from "@/lib/timeline/public-timeline";

type FamilyTimelineMember = {
  id: string;
  fullName: string;
  role: "Partner" | "Child";
};

function memberEventContext(member: FamilyTimelineMember): string {
  return member.role === "Partner" ? `Partner · ${member.fullName}` : `Child · ${member.fullName}`;
}

function timelineItemFromEvent(args: {
  event: {
    id: string;
    eventType: string | null;
    customType: string | null;
    value: string | null;
    date: { original: string | null; year: number | null; month: number | null; day: number | null } | null;
    place: GedcomPlaceDisplayRow | null;
  };
  context: string;
  descriptionFallback: string;
  sortPriority: number;
}): TimelineBuildItem | null {
  const { event } = args;
  const year = event.date?.year ?? null;
  const title = eventTitle(event.eventType, event.customType);
  if (title === "Life event") return null;
  const place = fullPlaceLabel(event.place);
  return {
    id: `event-${event.id}`,
    eventId: event.id,
    dateLabel: dateLabelFromParts(event.date?.original, year),
    title,
    place,
    description: event.value?.trim() || args.descriptionFallback,
    context: args.context,
    sortYear: year,
    sortMonth: event.date?.month ?? 0,
    sortDay: event.date?.day ?? 0,
    sortPriority: args.sortPriority,
  };
}

export async function buildFamilyTimeline(
  fileUuid: string,
  familyId: string,
  members: FamilyTimelineMember[],
  viewer: PublicViewer,
): Promise<PublicProfileTimelineItem[]> {
  const memberIds = members.map((m) => m.id);
  const memberById = new Map(members.map((m) => [m.id, m]));
  const items: TimelineBuildItem[] = [];

  const familyEventRows = await prisma.gedcomFamilyEvent.findMany({
    where: { fileUuid, familyId },
    select: {
      event: {
        select: {
          ...GEDCOM_EVENT_TIMELINE_SELECT,
          place: { select: GEDCOM_PLACE_DISPLAY_SELECT },
        },
      },
    },
  });

  for (const { event } of familyEventRows) {
    const title = eventTitle(event.eventType, event.customType);
    const place = fullPlaceLabel(event.place);
    const item = timelineItemFromEvent({
      event,
      context: "Family event",
      descriptionFallback: place
        ? `${title} recorded for this family in ${place}.`
        : `${title} recorded for this family.`,
      sortPriority: 10,
    });
    if (item) items.push(item);
  }

  if (memberIds.length > 0) {
    const individualEventRows = await prisma.gedcomIndividualEvent.findMany({
      where: { fileUuid, individualId: { in: memberIds } },
      select: {
        individualId: true,
        event: {
          select: {
            ...GEDCOM_EVENT_TIMELINE_SELECT,
            place: { select: GEDCOM_PLACE_DISPLAY_SELECT },
          },
        },
      },
    });

    for (const { individualId, event } of individualEventRows) {
      const member = memberById.get(individualId);
      if (!member) continue;
      const place = fullPlaceLabel(event.place);
      const title = eventTitle(event.eventType, event.customType);
      const item = timelineItemFromEvent({
        event,
        context: memberEventContext(member),
        descriptionFallback: place
          ? `${title} for ${member.fullName} recorded in ${place}.`
          : `${title} for ${member.fullName} recorded in the family tree.`,
        sortPriority: member.role === "Partner" ? 20 : 30,
      });
      if (item) items.push(item);
    }
  }

  const eventLinksById = await loadEventLivingLinksByIds(
    fileUuid,
    [...new Set(items.map((item) => item.eventId))],
  );

  return sortTimeline(
    dedupeTimelineByEventId(items).map((item) => {
      const links = eventLinksById.get(item.eventId);
      if (!links) return item;
      return { ...item, ...applyLivingPrivacyToTimelineItem(viewer, item, links, item.eventId) };
    }),
  );
}
