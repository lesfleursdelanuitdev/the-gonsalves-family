import { gedcomNameToDisplayName } from "@ligneous/album-view";
import type { PublicFamily } from "@/components/families/types";
import {
  formatMinimalLivingLabel,
  shouldRedactLivingPerson,
} from "@/lib/auth/living-person-privacy";
import type { PublicViewer } from "@/lib/auth/public-viewer-context";
import type { IndividualPrivacyHint } from "@/lib/individuals/load-individual-living-status";
import type {
  UpcomingAnniversaryItem,
  UpcomingAnniversaryMonthGroup,
} from "./group-upcoming-anniversaries";
import type { UpcomingEventRow, UpcomingEventType } from "./query-upcoming-events";

function displayName(fullName: string | null | undefined, xref: string): string {
  return gedcomNameToDisplayName(fullName ?? null, xref) || xref || "Unknown";
}

function minimalNameFromHint(hint: IndividualPrivacyHint | undefined, fallbackName: string): string {
  if (!hint) return fallbackName;
  const name = displayName(hint.fullName, hint.xref);
  return formatMinimalLivingLabel(name, hint.birthYear);
}

export function collectUpcomingEventIndividualIds(events: UpcomingEventRow[]): string[] {
  const ids = new Set<string>();
  for (const ev of events) {
    if (ev.individual?.id) ids.add(ev.individual.id);
    if (ev.family?.husband?.id) ids.add(ev.family.husband.id);
    if (ev.family?.wife?.id) ids.add(ev.family.wife.id);
  }
  return [...ids];
}

export function redactLivingBirthdayOccasionSubtitle(
  eventType: UpcomingEventType,
  occasionSubtitle: string,
  isLiving: boolean,
  viewer: PublicViewer,
): string {
  if (eventType !== "BIRT" || !shouldRedactLivingPerson(viewer, isLiving)) return occasionSubtitle;
  if (
    occasionSubtitle === "Birthday" ||
    occasionSubtitle === "Born this year" ||
    occasionSubtitle.startsWith("Turning ")
  ) {
    return "Birthday";
  }
  return occasionSubtitle;
}

export function redactUpcomingEventRowForViewer(
  event: UpcomingEventRow,
  viewer: PublicViewer,
  hints: Map<string, IndividualPrivacyHint>,
): UpcomingEventRow {
  let individual = event.individual;
  if (individual) {
    const hint = hints.get(individual.id);
    if (hint && shouldRedactLivingPerson(viewer, hint.isLiving)) {
      individual = {
        ...individual,
        fullName: minimalNameFromHint(hint, displayName(individual.fullName, individual.xref)),
      };
    }
  }

  let family = event.family;
  if (family) {
    const redactPartner = (
      partner: NonNullable<typeof family>["husband"],
      hint: IndividualPrivacyHint | undefined,
    ) => {
      if (!partner || !hint || !shouldRedactLivingPerson(viewer, hint.isLiving)) return partner;
      return {
        ...partner,
        fullName: minimalNameFromHint(hint, displayName(partner.fullName, partner.xref)),
      };
    };
    family = {
      ...family,
      husband: redactPartner(family.husband, family.husband ? hints.get(family.husband.id) : undefined),
      wife: redactPartner(family.wife, family.wife ? hints.get(family.wife.id) : undefined),
    };
  }

  const personHint = event.individual?.id ? hints.get(event.individual.id) : undefined;
  const redactPlace =
    event.eventType === "BIRT" &&
    personHint != null &&
    shouldRedactLivingPerson(viewer, personHint.isLiving);

  return {
    ...event,
    individual,
    family,
    place: redactPlace ? null : event.place,
  };
}

export function redactUpcomingEventsForViewer(
  events: UpcomingEventRow[],
  viewer: PublicViewer,
  hints: Map<string, IndividualPrivacyHint>,
): UpcomingEventRow[] {
  return events.map((event) => redactUpcomingEventRowForViewer(event, viewer, hints));
}

function familyTitleFromPartners(partners: PublicFamily["partners"]): string {
  if (partners.length === 0) return "Family";
  if (partners.length === 1) return partners[0]!.fullName;
  return `${partners[0]!.fullName} & ${partners[1]!.fullName}`;
}

export function redactPublicFamilyForAnniversaryViewer(
  family: PublicFamily,
  viewer: PublicViewer,
  hints: Map<string, IndividualPrivacyHint>,
): PublicFamily {
  let privacyRestricted = false;
  const partners = family.partners.map((partner) => {
    const hint = hints.get(partner.id);
    if (!hint || !shouldRedactLivingPerson(viewer, hint.isLiving)) return partner;
    privacyRestricted = true;
    return {
      ...partner,
      portraitSrc: null,
      fullName: minimalNameFromHint(hint, partner.fullName),
    };
  });

  return {
    ...family,
    partners,
    title: familyTitleFromPartners(partners),
    privacyRestricted: privacyRestricted || family.privacyRestricted,
  };
}

export function redactUpcomingAnniversaryItemForViewer(
  item: UpcomingAnniversaryItem,
  viewer: PublicViewer,
  hints: Map<string, IndividualPrivacyHint>,
): UpcomingAnniversaryItem {
  if (item.kind === "person") {
    return {
      ...item,
      occasionSubtitle: redactLivingBirthdayOccasionSubtitle(
        item.eventType,
        item.occasionSubtitle,
        item.person.isLiving,
        viewer,
      ),
    };
  }

  return {
    ...item,
    family: redactPublicFamilyForAnniversaryViewer(item.family, viewer, hints),
  };
}

export function redactUpcomingAnniversaryMonthGroupsForViewer(
  groups: UpcomingAnniversaryMonthGroup[],
  viewer: PublicViewer,
  hints: Map<string, IndividualPrivacyHint>,
): UpcomingAnniversaryMonthGroup[] {
  return groups.map((group) => ({
    ...group,
    sections: group.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => redactUpcomingAnniversaryItemForViewer(item, viewer, hints)),
    })),
  }));
}
