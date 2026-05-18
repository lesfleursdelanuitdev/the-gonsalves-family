import type { PublicIndividual } from "@/components/individuals/types";
import type { GivenNameStatisticsPayload } from "@/lib/given-names/build-given-name-statistics";

export type PublicGivenName = {
  id: string;
  givenName: string;
  displayGivenName: string;
  /** Occurrences in gedcom_given_names_v2 at import (may be stale). */
  frequency: number;
  /** Individuals linked via name forms for this catalog entry. */
  peopleCount: number;
  profileHref: string;
  individualsHref: string;
};

export type PublicGivenNameProfile = PublicGivenName & {
  statistics: GivenNameStatisticsPayload;
  samplePeople: PublicIndividual[];
};
