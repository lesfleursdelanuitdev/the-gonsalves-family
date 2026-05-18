/** No death on record and age would exceed this → treated as likely deceased. */
export const MAX_AGE_ASSUMING_LIVING = 120;

export type PersonLifeStatus = "living" | "dead";

/**
 * Living/dead for public individuals:
 * 1. Death year on record → deceased.
 * 2. No death year but born more than 120 years ago → likely deceased.
 */
export function personLifeStatus(
  person: { birthYear: number | null; deathYear: number | null },
  referenceYear: number = new Date().getFullYear(),
): PersonLifeStatus {
  if (person.deathYear != null) return "dead";
  if (person.birthYear != null && referenceYear - person.birthYear > MAX_AGE_ASSUMING_LIVING) {
    return "dead";
  }
  return "living";
}

export function isPersonLiving(
  person: { birthYear: number | null; deathYear: number | null },
  referenceYear?: number,
): boolean {
  return personLifeStatus(person, referenceYear) === "living";
}
