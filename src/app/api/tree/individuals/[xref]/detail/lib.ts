import { Prisma } from "@ligneous/prisma";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";

export function normalizeXref(xref: string): string {
  const s = xref.trim();
  return s.startsWith("@") ? s : `@${s}@`;
}

/** Strip GEDCOM slashes from last names for display (e.g. "John /Reyes/" → "John Reyes"). */
export function stripSlashesFromName(s: string | null | undefined): string | null {
  const t = formatGedcomFullNameForDisplay(s);
  return t === "" ? null : t;
}

export type Row = Record<string, unknown>;

/** Additive camelCase NL denorm fields from a raw `gedcom_individuals_v2` row (`primary_surname_lower`, …). */
export function nlIndividualAddonFromSqlPerson(person: Row) {
  return {
    primarySurnameLower: (person.primary_surname_lower as string | null) ?? null,
    birthCountry: (person.birth_country as string | null) ?? null,
    birthCountryLower: (person.birth_country_lower as string | null) ?? null,
    deathCountry: (person.death_country as string | null) ?? null,
    deathCountryLower: (person.death_country_lower as string | null) ?? null,
    ageAtDeath: person.age_at_death != null ? Number(person.age_at_death) : null,
    generationDepth: person.generation_depth != null ? Number(person.generation_depth) : null,
  };
}

export interface PersonDetailContext {
  fileUuid: string;
  personId: string;
  person: Row;
  normalizedXref: string;
}

function looksLikeIndividualUuid(raw: string): boolean {
  const s = raw.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export async function getPersonDetailContext(
  xref: string
): Promise<PersonDetailContext | null> {
  if (!process.env.DATABASE_URL) return null;
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const trimmed = xref.trim();

  if (looksLikeIndividualUuid(trimmed)) {
    const personRows = await prisma.$queryRaw<Row[]>(
      Prisma.sql`
        SELECT id, xref, full_name, birth_date_display, birth_place_display,
               death_date_display, death_place_display, sex, gender,
               primary_surname_lower, birth_country, birth_country_lower,
               death_country, death_country_lower, age_at_death, generation_depth
        FROM gedcom_individuals_v2
        WHERE file_uuid = ${fileUuid}::uuid AND id = ${trimmed}::uuid
        LIMIT 1
      `
    );
    const person = personRows[0];
    if (!person) return null;
    const xr = (person.xref as string | null | undefined)?.trim();
    const normalizedXref = xr ? normalizeXref(xr) : normalizeXref(trimmed);
    return {
      fileUuid,
      personId: person.id as string,
      person,
      normalizedXref,
    };
  }

  const normalizedXref = normalizeXref(xref);
  const personRows = await prisma.$queryRaw<Row[]>(
    Prisma.sql`
      SELECT id, full_name, birth_date_display, birth_place_display,
             death_date_display, death_place_display, sex, gender,
             primary_surname_lower, birth_country, birth_country_lower,
             death_country, death_country_lower, age_at_death, generation_depth
      FROM gedcom_individuals_v2
      WHERE file_uuid = ${fileUuid}::uuid AND xref = ${normalizedXref}
      LIMIT 1
    `
  );
  const person = personRows[0];
  if (!person) return null;

  return {
    fileUuid,
    personId: person.id as string,
    person,
    normalizedXref,
  };
}
