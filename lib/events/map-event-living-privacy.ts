import {
  shouldGateLivingEventContent,
  EVENT_LIVING_PARTICIPANT_SELECT,
  type EventLivingLinkInput,
} from "@/lib/auth/living-event-privacy";
import { buildLoginWallPath } from "@/lib/auth/public-viewer";
import type { PublicViewer } from "@/lib/auth/public-viewer-context";
import type { PublicEvent } from "@/components/events/types";
import type { PublicProfileTimelineItem } from "@/lib/timeline/public-timeline";
import { prisma } from "@/lib/database/prisma";

export function eventLoginPath(eventId: string): string {
  return `/tree/events/${encodeURIComponent(eventId)}`;
}

export function applyLivingPrivacyToPublicEvent(
  viewer: PublicViewer,
  event: PublicEvent,
  links: EventLivingLinkInput,
  loginPath = eventLoginPath(event.id),
): PublicEvent {
  const privacyRestricted = shouldGateLivingEventContent(viewer, links);
  if (!privacyRestricted) {
    return { ...event, privacyRestricted: false, loginHref: null };
  }

  return {
    ...event,
    customType: null,
    eventLabel: null,
    value: null,
    cause: null,
    dateLabel: null,
    year: null,
    placeLabel: null,
    placeHref: null,
    subjectName: null,
    subjectHref: null,
    privacyRestricted: true,
    loginHref: buildLoginWallPath(loginPath),
  };
}

export function applyLivingPrivacyToTimelineItem<T extends PublicProfileTimelineItem>(
  viewer: PublicViewer,
  item: T,
  links: EventLivingLinkInput,
  eventId: string,
): T {
  const privacyRestricted = shouldGateLivingEventContent(viewer, links);
  if (!privacyRestricted) {
    return { ...item, privacyRestricted: false, loginHref: null };
  }

  return {
    ...item,
    dateLabel: "Private event",
    title: item.context === "Personal event" || item.context === "Family event" ? "Private event" : item.title,
    place: null,
    description: "This event relates to one or more living family members. Sign in to view its details.",
    privacyRestricted: true,
    loginHref: buildLoginWallPath(eventLoginPath(eventId)),
  };
}

export async function loadEventLivingLinksByIds(
  fileUuid: string,
  eventIds: string[],
): Promise<Map<string, EventLivingLinkInput>> {
  if (eventIds.length === 0) return new Map();

  const rows = await prisma.gedcomEvent.findMany({
    where: { fileUuid, id: { in: eventIds } },
    select: {
      id: true,
      ...EVENT_LIVING_PARTICIPANT_SELECT,
    },
  });

  return new Map(rows.map((row) => [row.id, row]));
}
