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
  isLiving: boolean;
  sex: string | null;
  gender: string | null;
  individualNameForms?: Array<{
    givenNames: Array<{ givenName: { givenName: string } }>;
    surnames: Array<{ surname: { surname: string } }>;
  }>;
};

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
