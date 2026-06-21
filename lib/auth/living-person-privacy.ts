import type { PublicViewer } from "@/lib/auth/public-viewer";
import { canViewFullIndividual } from "@/lib/auth/public-viewer";
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
};

export function redactSearchIndividualForViewer<T extends SearchIndividualPrivacyFields>(
  individual: T,
  viewer: PublicViewer,
): T {
  if (!shouldRedactLivingPerson(viewer, individual.isLiving)) return individual;
  const displayName = individual.displayName ?? individual.fullName ?? "Unknown";
  return {
    ...individual,
    displayName,
    fullName: displayName,
    birthYear: individual.birthYear ?? null,
    deathYear: null,
    portraitSrc: null,
    profileHref: null,
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

export function filterFeaturedIndividualsForViewer<T extends FeaturedIndividualPrivacyFields>(
  individuals: T[],
  viewer: PublicViewer,
): T[] {
  return individuals.filter((individual) => {
    if (!individual.isLiving) return true;
    return !shouldRedactLivingPerson(viewer, true);
  });
}

export type FamilyPartnerPrivacyFields = {
  id: string;
  displayName?: string | null;
  fullName?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  profileHref?: string | null;
  isLiving?: boolean;
};

export function redactFamilyPartnerForViewer<T extends FamilyPartnerPrivacyFields>(
  partner: T | null,
  viewer: PublicViewer,
): T | null {
  if (!partner) return null;
  if (!partner.isLiving || !shouldRedactLivingPerson(viewer, true)) return partner;
  const displayName = partner.displayName ?? partner.fullName ?? "Unknown";
  return {
    ...partner,
    displayName,
    fullName: displayName,
    birthYear: partner.birthYear ?? null,
    deathYear: null,
    profileHref: null,
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
    displayName: string;
    xref: string;
    partners: Array<{ displayName: string; isLiving: boolean; birthYear: number | null }>;
  },
  viewer: PublicViewer,
): { displayName: string; xref: string } {
  const redactedNames = args.partners.map((partner) => {
    if (!shouldRedactLivingPerson(viewer, partner.isLiving)) return partner.displayName;
    return formatMinimalLivingLabel(partner.displayName, partner.birthYear);
  });
  const displayName =
    redactedNames.filter(Boolean).join(" & ").trim() || args.displayName;
  return { displayName, xref: args.xref };
}
