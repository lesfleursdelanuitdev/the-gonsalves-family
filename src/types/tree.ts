/**
 * Types for Tree API responses (Gonsalves Family Tree / tree1.ged).
 */

/** Summary shape from GET /api/tree/individuals (uuid, names, xref) */
export interface TreeIndividualSummary {
  uuid: string;
  names: { givenNames: string[]; lastName: string | null };
  xref: string;
}

export interface TreeIndividual {
  id: string;
  xref: string;
  firstName: string | null;
  lastName: string | null;
  /** All given names in order (from primary name form) */
  givenNames: string[];
  birthDate: string | null;
  birthPlace: string | null;
  deathDate: string | null;
  deathPlace: string | null;
  isLiving: boolean;
  gender: string | null;
}

/** Individual with depth (generation) for ancestors/descendants endpoints */
export interface TreeIndividualWithDepth extends TreeIndividual {
  depth: number;
}

export interface AncestorsResponse {
  ancestors: TreeIndividualWithDepth[];
  meta: { total: number; maxDepth: number };
}

export interface DescendantsResponse {
  descendants: TreeIndividualWithDepth[];
  meta: { total: number; maxDepth: number };
}

export interface TreeFamily {
  id: string;
  xref: string;
  husbandXref: string | null;
  wifeXref: string | null;
  marriageDateDisplay: string | null;
  marriagePlaceDisplay: string | null;
  divorceDateDisplay: string | null;
  divorcePlaceDisplay: string | null;
  isDivorced: boolean;
  childrenCount: number;
  /** Resolved display names (e.g. from random family endpoint) */
  husbandName?: string | null;
  wifeName?: string | null;
}

export interface TreeEvent {
  id: string;
  eventType: string;
  customType: string | null;
  value: string | null;
  cause: string | null;
  sortOrder: number;
  dateDisplay?: string | null;
  placeDisplay?: string | null;
}

export interface TreeDate {
  id: string;
  original: string | null;
  dateType: string;
  year: number | null;
  month: number | null;
  day: number | null;
  endYear: number | null;
  endMonth: number | null;
  endDay: number | null;
}

export interface TreePlace {
  id: string;
  original: string;
  name: string | null;
  county: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface TreeSurname {
  id: string;
  surname: string;
  frequency: number;
}

export interface TreeGivenName {
  id: string;
  givenName: string;
  frequency: number;
}

/** One event from GET /api/tree/events/upcoming (BIRT, DEAT, or MARR in the next 3 months). */
export interface UpcomingEvent {
  eventType: "BIRT" | "DEAT" | "MARR";
  date: {
    original: string | null;
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  place: { original: string | null; name: string | null } | null;
  individual?: { xref: string; fullName: string } | null;
  family?: {
    husband: { xref: string; fullName: string } | null;
    wife: { xref: string; fullName: string } | null;
  } | null;
}

export interface UpcomingEventsResponse {
  window: { start: { month: number; day: number }; end: { month: number; day: number } };
  events: UpcomingEvent[];
}
