/**
 * Shared mapping logic for GedcomIndividual to API response shape.
 * Used by individuals list, ancestors, and descendants endpoints.
 */

/** Parse GEDCOM fullName "Given /Surname/" into firstName and lastName */
export function parseFullName(
  fullName: string | null
): { firstName: string | null; lastName: string | null } {
  if (!fullName || !fullName.trim()) return { firstName: null, lastName: null };
  const match = fullName.match(/^(.+?)\s*\/\s*([^/]+)\/?\s*$/);
  if (match) {
    return {
      firstName: match[1].trim() || null,
      lastName: match[2].trim() || null,
    };
  }
  return { firstName: fullName.trim(), lastName: null };
}

/** Map sex enum to display string */
export function formatGender(sex: string | null, gender: string | null): string | null {
  if (sex) {
    const map: Record<string, string> = { M: "Male", F: "Female", U: "Unknown", X: "Other" };
    return map[sex] ?? sex;
  }
  return gender || null;
}

/** Row shape from Prisma with name forms (for mapping) */
export type IndividualRowForMapping = {
  id: string;
  xref: string;
  fullName: string | null;
  birthDateDisplay: string | null;
  birthPlaceDisplay: string | null;
  deathDateDisplay: string | null;
  deathPlaceDisplay: string | null;
  /** Denormalized from primary birth date; prefer over parsing birthDateDisplay for chart years */
  birthYear?: number | null;
  deathYear?: number | null;
  isLiving: boolean;
  sex: string | null;
  gender: string | null;
  individualNameForms?: Array<{
    givenNames: Array<{ givenName: { givenName: string } }>;
    surnames: Array<{ surname: { surname: string } }>;
  }>;
};

/**
 * Extract a 4-digit year from a display date (handles "15 Jan 1990", "1990", ISO-ish fragments).
 */
export function yearFromDisplayDateString(dateString: string | null | undefined): number | null {
  if (dateString == null || dateString.trim() === "") return null;
  const match = dateString.trim().match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  return match ? parseInt(match[1]!, 10) : null;
}

/** Chart node years: prefer DB columns, else parse display strings. */
export function individualLifeYearsFromRow(
  row: Pick<
    IndividualRowForMapping,
    "birthYear" | "deathYear" | "birthDateDisplay" | "deathDateDisplay"
  >,
): { birthYear: number | null; deathYear: number | null } {
  return {
    birthYear: row.birthYear ?? yearFromDisplayDateString(row.birthDateDisplay),
    deathYear: row.deathYear ?? yearFromDisplayDateString(row.deathDateDisplay),
  };
}

export interface MappedIndividual {
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

export function mapIndividualRow(row: IndividualRowForMapping): MappedIndividual {
  const primaryForm = row.individualNameForms?.[0];
  let firstName: string | null = null;
  let lastName: string | null = null;

  let givenNames: string[] = [];

  if (primaryForm) {
    givenNames = primaryForm.givenNames
      .map((g) => g.givenName.givenName)
      .filter(Boolean);
    const surnameParts = primaryForm.surnames.map((s) => s.surname.surname).filter(Boolean);
    firstName = givenNames.length > 0 ? givenNames.join(" ") : null;
    lastName = surnameParts.length > 0 ? surnameParts.join(" ") : null;
  }
  if (firstName === null && lastName === null) {
    const parsed = parseFullName(row.fullName);
    firstName = parsed.firstName;
    lastName = parsed.lastName;
    givenNames = firstName ? [firstName] : [];
  }

  return {
    id: row.id,
    xref: row.xref,
    firstName,
    lastName,
    givenNames,
    birthDate: row.birthDateDisplay ?? null,
    birthPlace: row.birthPlaceDisplay ?? null,
    deathDate: row.deathDateDisplay ?? null,
    deathPlace: row.deathPlaceDisplay ?? null,
    isLiving: row.isLiving,
    gender: formatGender(row.sex, row.gender),
  };
}
