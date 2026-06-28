import type { PublicViewer } from "@/lib/auth/public-viewer";
import { buildLoginWallPath, canViewFullIndividual } from "@/lib/auth/public-viewer";
import type { MappedIndividual } from "@/lib/individual-mapper";
import { yearFromDisplayDateString } from "@/lib/individual-mapper";

export type MinimalLivingPersonPublic = {
  id: string;
  xref: string;
  displayName: string;
  birthYear: number | null;
  isLiving: true;
};

export type TreePersonPrivacyFields = {
  isLiving: boolean;
  birthYear?: number | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  deathDate?: string | null;
  deathPlace?: string | null;
  deathYear?: number | null;
  photoUrl?: string | null;
  portraitSrc?: string | null;
};

export function formatMinimalLivingLabel(displayName: string, birthYear: number | null): string {
  if (birthYear == null) return displayName;
  return `${displayName} · b. ${birthYear}`;
}

export function shouldRedactLivingPerson(viewer: PublicViewer, isLiving: boolean): boolean {
  return isLiving && !canViewFullIndividual(viewer, isLiving);
}

export function minimalLivingPerson(args: {
  id: string;
  xref: string;
  displayName: string;
  birthYear: number | null;
}): MinimalLivingPersonPublic {
  return {
    id: args.id,
    xref: args.xref,
    displayName: args.displayName,
    birthYear: args.birthYear,
    isLiving: true,
  };
}

export function redactTreePersonForViewer<T extends TreePersonPrivacyFields>(
  person: T,
  viewer: PublicViewer,
): T {
  if (!shouldRedactLivingPerson(viewer, person.isLiving)) return person;
  const birthYear = person.birthYear ?? null;
  return {
    ...person,
    birthDate: birthYear != null ? String(birthYear) : null,
    birthPlace: null,
    deathDate: null,
    deathPlace: null,
    deathYear: null,
    photoUrl: null,
    portraitSrc: null,
  };
}

export function redactTreePeopleForViewer<T extends TreePersonPrivacyFields>(
  people: T[],
  viewer: PublicViewer,
): T[] {
  return people.map((person) => redactTreePersonForViewer(person, viewer));
}

export type RelationPrivacyFields = {
  id: string;
  fullName: string;
  birthYear: number | null;
  deathYear?: number | null;
  portraitSrc?: string | null;
  isLiving?: boolean;
  relationship?: string;
};

export function redactRelationForViewer<T extends RelationPrivacyFields>(
  relation: T,
  viewer: PublicViewer,
): T {
  if (!relation.isLiving || !shouldRedactLivingPerson(viewer, true)) return relation;
  return {
    ...relation,
    birthYear: relation.birthYear ?? null,
    deathYear: null,
    portraitSrc: null,
  };
}

export function redactRelationsForViewer<T extends RelationPrivacyFields>(
  relations: T[],
  viewer: PublicViewer,
): T[] {
  return relations.map((relation) => redactRelationForViewer(relation, viewer));
}

export type SearchIndividualPrivacyFields = {
  id: string;
  xref?: string;
  fullName?: string | null;
  displayName?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  sex?: string | null;
  gender?: string | null;
  isLiving: boolean;
  portraitSrc?: string | null;
  profileHref?: string | null;
  birthCountry?: string | null;
  birthCountryLower?: string | null;
  deathCountry?: string | null;
  deathCountryLower?: string | null;
  ageAtDeath?: number | null;
  generationDepth?: number | null;
  birthDateDisplay?: string | null;
  birthPlaceDisplay?: string | null;
  deathDateDisplay?: string | null;
  deathPlaceDisplay?: string | null;
};

export function redactSearchIndividualForViewer<T extends SearchIndividualPrivacyFields>(
  individual: T,
  viewer: PublicViewer,
): T {
  if (!shouldRedactLivingPerson(viewer, individual.isLiving)) return individual;
  const rawName = individual.displayName ?? individual.fullName ?? "Unknown";
  const minimal = formatMinimalLivingLabel(rawName, individual.birthYear ?? null);
  const loginHref = buildLoginWallPath(`/individuals/${encodeURIComponent(individual.id)}`);
  return {
    ...individual,
    displayName: minimal,
    fullName: minimal,
    birthYear: individual.birthYear ?? null,
    deathYear: null,
    portraitSrc: null,
    profileHref: loginHref,
    birthCountry: null,
    birthCountryLower: null,
    deathCountry: null,
    deathCountryLower: null,
    ageAtDeath: null,
    generationDepth: null,
    birthDateDisplay: null,
    birthPlaceDisplay: null,
    deathDateDisplay: null,
    deathPlaceDisplay: null,
  };
}

export function redactSearchIndividualsForViewer<T extends SearchIndividualPrivacyFields>(
  individuals: T[],
  viewer: PublicViewer,
): T[] {
  return individuals.map((individual) => redactSearchIndividualForViewer(individual, viewer));
}

export type FeaturedIndividualPrivacyFields = {
  id: string;
  isLiving?: boolean;
};

export const LIVING_PEOPLE_SUMMARY_ID = "__living-people-summary__";

export function formatLivingPeopleCountSuffix(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "+ 1 living person";
  return `+ ${count} living people`;
}

export function formatLivingPeopleOnlyLabel(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "1 living person";
  return `${count} living people`;
}

export type LinkedIndividualForPrivacy = {
  id: string;
  displayName: string;
  isLiving?: boolean;
  isLivingSummary?: boolean;
  xref?: string;
  gedcomName?: string;
  mediaCount?: number;
  thumbnailUrl?: string | null;
};

export function countFeaturedPeople<
  T extends { isLivingSummary?: boolean; isLiving?: boolean; displayName?: string },
>(people: T[], livingSummaryCount?: number): number {
  const summary = people.find((person) => person.isLivingSummary);
  const deceasedCount = people.filter((person) => !person.isLivingSummary).length;
  if (summary && livingSummaryCount != null && livingSummaryCount > 0) {
    return deceasedCount + livingSummaryCount;
  }
  if (summary) {
    const match = summary.displayName?.match(/^(\d+)\s+living/);
    if (match) return deceasedCount + Number(match[1]);
  }
  return people.length;
}

export function collapseLinkedIndividualsForViewer<T extends LinkedIndividualForPrivacy>(
  people: T[],
  viewer: PublicViewer,
): T[] {
  const livingPeople = people.filter((person) => person.isLiving);
  if (livingPeople.length === 0) return people;
  if (!shouldRedactLivingPerson(viewer, true)) return people;

  const deceased = people.filter((person) => !person.isLiving);
  const livingCount = livingPeople.length;
  const summary = {
    id: LIVING_PEOPLE_SUMMARY_ID,
    xref: "",
    gedcomName: "",
    displayName:
      deceased.length > 0
        ? formatLivingPeopleCountSuffix(livingCount)
        : formatLivingPeopleOnlyLabel(livingCount),
    isLivingSummary: true,
  } as T;

  return deceased.length > 0 ? [...deceased, summary] : [summary];
}

export type PersonLinkInput = {
  id: string;
  xref: string;
  fullName: string | null;
  isLiving: boolean;
};

export function collectUniquePersonLinksFromMediaRow(row: {
  individualMedia: Array<{ individual: PersonLinkInput }>;
  individualProfileFor: Array<{ individual: PersonLinkInput }>;
  familyMedia: Array<{
    family: {
      husband: PersonLinkInput | null;
      wife: PersonLinkInput | null;
    };
  }>;
  familyProfileFor?: Array<{
    family: {
      husband: PersonLinkInput | null;
      wife: PersonLinkInput | null;
    };
  }>;
}): PersonLinkInput[] {
  const byId = new Map<string, PersonLinkInput>();
  const add = (person: PersonLinkInput | null | undefined) => {
    if (!person?.id || byId.has(person.id)) return;
    byId.set(person.id, person);
  };
  for (const link of row.individualMedia) add(link.individual);
  for (const link of row.individualProfileFor) add(link.individual);
  for (const link of row.familyMedia) {
    add(link.family.husband);
    add(link.family.wife);
  }
  for (const link of row.familyProfileFor ?? []) {
    add(link.family.husband);
    add(link.family.wife);
  }
  return [...byId.values()];
}

export function buildCollapsedPersonMediaLinks(args: {
  people: PersonLinkInput[];
  viewer: PublicViewer;
  personLabel: (fullName: string | null, xref: string) => string;
  personHref: (individualId: string) => string;
}): Array<{ label: string; href?: string; isLivingSummary?: boolean }> {
  const livingCount = args.people.filter((person) => person.isLiving).length;
  if (livingCount === 0 || !shouldRedactLivingPerson(args.viewer, true)) {
    return args.people.map((person) => ({
      label: args.personLabel(person.fullName, person.xref),
      href: args.personHref(person.id),
    }));
  }

  const deceased = args.people.filter((person) => !person.isLiving);
  const links: Array<{ label: string; href?: string; isLivingSummary?: boolean }> = deceased.map(
    (person) => ({
      label: args.personLabel(person.fullName, person.xref),
      href: args.personHref(person.id),
    }),
  );

  links.push({
    label:
      deceased.length > 0
        ? formatLivingPeopleCountSuffix(livingCount)
        : formatLivingPeopleOnlyLabel(livingCount),
    isLivingSummary: true,
  });
  return links;
}

export function filterFeaturedIndividualsForViewer<T extends FeaturedIndividualPrivacyFields>(
  individuals: T[],
  viewer: PublicViewer,
): T[] {
  return individuals.filter((individual) => {
    if (!individual.isLiving) return true;
    return !shouldRedactLivingPerson(viewer, true);
  });
}

export type EventLinkedPersonPrivacyFields = {
  id: string;
  displayName: string;
  profileHref?: string | null;
  isLiving?: boolean;
};

/** Keep linked person names on events; profile pages gate living access behind login. */
export function redactEventLinkedPeopleForViewer<T extends EventLinkedPersonPrivacyFields>(
  people: T[],
  _viewer: PublicViewer,
): T[] {
  return people;
}

export type FamilyPartnerPrivacyFields = {
  id: string;
  displayName?: string | null;
  fullName?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  portraitSrc?: string | null;
  profileHref?: string | null;
  isLiving?: boolean;
};

export function redactFamilyPartnerForViewer<T extends FamilyPartnerPrivacyFields>(
  partner: T | null,
  viewer: PublicViewer,
): T | null {
  if (!partner) return null;
  if (!partner.isLiving || !shouldRedactLivingPerson(viewer, true)) return partner;
  const rawName = partner.displayName ?? partner.fullName ?? "Unknown";
  const minimal = formatMinimalLivingLabel(rawName, partner.birthYear ?? null);
  return {
    ...partner,
    displayName: minimal,
    fullName: minimal,
    birthYear: partner.birthYear ?? null,
    deathYear: null,
    portraitSrc: null,
    profileHref: buildLoginWallPath(`/individuals/${encodeURIComponent(partner.id)}`),
  };
}

export type PublicFamilyMemberPrivacyFields = {
  id: string;
  fullName: string;
  isLiving: boolean;
  birthYear: number | null;
  birthDateLabel?: string | null;
  deathDateLabel?: string | null;
  partnersCount?: number;
  childrenCount?: number;
  portraitSrc?: string | null;
  profileHref?: string;
};

export function redactPublicFamilyMemberForViewer<T extends PublicFamilyMemberPrivacyFields>(
  member: T,
  viewer: PublicViewer,
): T {
  if (!shouldRedactLivingPerson(viewer, member.isLiving)) return member;
  const minimal = formatMinimalLivingLabel(member.fullName, member.birthYear);
  return {
    ...member,
    fullName: minimal,
    birthDateLabel: member.birthYear != null ? String(member.birthYear) : null,
    deathDateLabel: null,
    partnersCount: 0,
    childrenCount: 0,
    portraitSrc: null,
    profileHref: buildLoginWallPath(`/individuals/${encodeURIComponent(member.id)}`),
  };
}

export function redactPublicFamilyMembersForViewer<T extends PublicFamilyMemberPrivacyFields>(
  members: T[],
  viewer: PublicViewer,
): T[] {
  return members.map((member) => redactPublicFamilyMemberForViewer(member, viewer));
}

/** @deprecated Use redactPublicFamilyMemberForViewer */
export function redactPublicFamilyMemberPortraitForViewer<T extends { isLiving: boolean; portraitSrc?: string | null }>(
  member: T,
  viewer: PublicViewer,
): T {
  return redactPublicFamilyMemberForViewer(member as T & PublicFamilyMemberPrivacyFields, viewer);
}

/** @deprecated Use redactPublicFamilyMembersForViewer */
export function redactPublicFamilyMemberPortraitsForViewer<T extends { isLiving: boolean; portraitSrc?: string | null }>(
  members: T[],
  viewer: PublicViewer,
): T[] {
  return redactPublicFamilyMembersForViewer(members as Array<T & PublicFamilyMemberPrivacyFields>, viewer);
}

export type PlacePersonPrivacyFields = {
  id: string;
  name: string;
  year: number | null;
  profileHref: string;
  isLiving: boolean;
};

export function redactPlacePersonForViewer<T extends PlacePersonPrivacyFields>(
  person: T,
  viewer: PublicViewer,
): T {
  if (!shouldRedactLivingPerson(viewer, person.isLiving)) return person;
  return {
    ...person,
    name: formatMinimalLivingLabel(person.name, person.year),
    profileHref: buildLoginWallPath(`/individuals/${encodeURIComponent(person.id)}`),
  };
}

export function redactMappedIndividualForViewer(
  mapped: MappedIndividual,
  viewer: PublicViewer,
): MappedIndividual {
  if (!shouldRedactLivingPerson(viewer, mapped.isLiving)) return mapped;
  const birthYear = yearFromDisplayDateString(mapped.birthDate);
  return {
    ...mapped,
    birthDate: birthYear != null ? String(birthYear) : null,
    birthPlace: null,
    deathDate: null,
    deathPlace: null,
  };
}

export type PublicIndividualListPrivacyFields = {
  isLiving: boolean;
  fullName: string;
  birthYear: number | null;
  deathYear?: number | null;
  portraitSrc?: string | null;
  currentLocationLabel?: string | null;
  placeLabels?: string[];
  age?: number | null;
  childrenCount?: number;
  hasDeathCause?: boolean;
};

export function redactPublicIndividualForViewer<T extends PublicIndividualListPrivacyFields>(
  individual: T,
  viewer: PublicViewer,
): T {
  if (!shouldRedactLivingPerson(viewer, individual.isLiving)) return individual;
  return {
    ...individual,
    birthYear: individual.birthYear ?? null,
    deathYear: null,
    portraitSrc: null,
    currentLocationLabel: null,
    placeLabels: [],
    age: null,
    childrenCount: 0,
    hasDeathCause: false,
  };
}

export function redactHomeStatisticsIndividualExample(
  args: { displayName: string; xref: string; isLiving: boolean; birthYear: number | null },
  viewer: PublicViewer,
): { displayName: string; xref: string } {
  if (!shouldRedactLivingPerson(viewer, args.isLiving)) {
    return { displayName: args.displayName, xref: args.xref };
  }
  return {
    displayName: formatMinimalLivingLabel(args.displayName, args.birthYear),
    xref: "",
  };
}

export function redactHomeStatisticsFamilyExample(
  args: {
    id: string;
    displayName: string;
    xref: string;
    partners: Array<{ displayName: string; isLiving: boolean; birthYear: number | null }>;
  },
  viewer: PublicViewer,
): { id: string; displayName: string; xref: string } {
  const redactedNames = args.partners.map((partner) => {
    if (!shouldRedactLivingPerson(viewer, partner.isLiving)) return partner.displayName;
    return formatMinimalLivingLabel(partner.displayName, partner.birthYear);
  });
  const displayName =
    redactedNames.filter(Boolean).join(" & ").trim() || args.displayName;
  return { id: args.id, displayName, xref: args.xref };
}
