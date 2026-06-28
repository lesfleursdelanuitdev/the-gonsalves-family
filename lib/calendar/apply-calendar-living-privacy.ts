import { formatMinimalLivingLabel } from "@/lib/auth/living-person-privacy";
import type { PublicViewer } from "@/lib/auth/public-viewer";
import { buildLoginWallPath, canViewFullIndividual, isAuthenticatedViewer } from "@/lib/auth/public-viewer";
import type { CalendarEvent } from "./query-calendar-events";

export function redactCalendarEventForViewer(
  event: CalendarEvent,
  viewer: PublicViewer,
): CalendarEvent {
  if (isAuthenticatedViewer(viewer) || !event.privacyRestricted) return event;
  return {
    ...event,
    profileHref: event.loginHref ?? buildLoginWallPath(event.profileHref),
  };
}

export function buildCalendarIndividualEvent(args: {
  id: string;
  displayName: string;
  birthYear: number | null;
  isLiving: boolean;
  profileHref: string;
  eventType: CalendarEvent["eventType"];
  year: number | null;
  eventId: string;
  viewer: PublicViewer;
}): CalendarEvent {
  const privacyRestricted = args.isLiving && !canViewFullIndividual(args.viewer, true);
  const minimalName = privacyRestricted
    ? formatMinimalLivingLabel(args.displayName, args.birthYear)
    : args.displayName;
  const profileHref = args.profileHref;
  const loginHref = privacyRestricted ? buildLoginWallPath(profileHref) : null;

  return {
    id: args.eventId,
    eventType: args.eventType,
    year: args.year,
    displayName: minimalName,
    profileHref: privacyRestricted ? (loginHref ?? profileHref) : profileHref,
    privacyRestricted,
    loginHref,
  };
}

export function buildCalendarFamilyEvent(args: {
  id: string;
  displayName: string;
  profileHref: string;
  eventType: CalendarEvent["eventType"];
  year: number | null;
  eventId: string;
  hasLivingPartner: boolean;
  viewer: PublicViewer;
}): CalendarEvent {
  const privacyRestricted = args.hasLivingPartner && !isAuthenticatedViewer(args.viewer);
  const loginHref = privacyRestricted ? buildLoginWallPath(args.profileHref) : null;

  return {
    id: args.eventId,
    eventType: args.eventType,
    year: args.year,
    displayName: args.displayName,
    profileHref: privacyRestricted ? (loginHref ?? args.profileHref) : args.profileHref,
    privacyRestricted,
    loginHref,
  };
}
