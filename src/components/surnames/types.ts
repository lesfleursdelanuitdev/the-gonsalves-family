import type { PublicIndividual } from "@/components/individuals/types";
import type { SurnameStatisticsPayload } from "@/lib/surnames/build-surname-statistics";

export type PublicSurname = {
  id: string;
  surname: string;
  displaySurname: string;
  /** Occurrences in gedcom_surnames_v2 at import (may be stale). */
  frequency: number;
  /** Individuals whose primary surname matches this catalog entry. */
  peopleCount: number;
  profileHref: string;
  individualsHref: string;
};

export type PublicSurnameProfile = PublicSurname & {
  soundex: string | null;
  metaphone: string | null;
  statistics: SurnameStatisticsPayload;
  samplePeople: PublicIndividual[];
};
