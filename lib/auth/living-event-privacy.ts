import {
  collectEventLinkedPeople,
  type EventParticipantsInput,
} from "@/lib/auth/living-exclusive-media";
import type { PublicViewer } from "@/lib/auth/public-viewer";
import { isAuthenticatedViewer } from "@/lib/auth/public-viewer";

export type EventLivingLinkInput = EventParticipantsInput;

export const EVENT_LIVING_PARTICIPANT_SELECT = {
  individualEvents: {
    select: { individual: { select: { id: true, isLiving: true } } },
  },
  familyEvents: {
    select: {
      family: {
        select: {
          husband: { select: { id: true, isLiving: true } },
          wife: { select: { id: true, isLiving: true } },
        },
      },
    },
  },
} as const;

/** True when the event has at least one linked person and every linked person is living. */
export function isEventLinkedOnlyToLivingPeople(input: EventLivingLinkInput): boolean {
  const people = collectEventLinkedPeople(input);
  if (people.size === 0) return false;
  return [...people.values()].every((isLiving) => isLiving);
}

export function shouldGateLivingEventContent(viewer: PublicViewer, input: EventLivingLinkInput): boolean {
  if (isAuthenticatedViewer(viewer)) return false;
  return isEventLinkedOnlyToLivingPeople(input);
}
