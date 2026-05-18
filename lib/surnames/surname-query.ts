import { Prisma } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";

/** Escape regex special chars for PostgreSQL regex literals. */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GEDCOM surname token prefix (after a slash), case-insensitive.
 * Allows optional whitespace after the slash (e.g. "Olga / Alleyne" as well as "John /Gonsalves/").
 */
export function surnamePrefixRegexPattern(lastNameInput: string): string {
  const prefix = escapeRegex(lastNameInput.trim().toLowerCase());
  return "\\/\\s*" + prefix;
}

export function stripSlashesFromName(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\//g, "").trim();
}

export function displaySurname(surname: string): string {
  return stripSlashesFromName(surname) || surname.trim() || "Unknown";
}

export async function fetchIndividualIdsForSurnamePrefix(
  fileUuid: string,
  lastNamePrefix: string,
  options?: { limit?: number; random?: boolean },
): Promise<string[]> {
  const prefix = stripSlashesFromName(lastNamePrefix);
  if (!prefix) return [];
  const pattern = surnamePrefixRegexPattern(prefix);
  const limit = options?.limit ?? 100_000;
  const order = options?.random ? Prisma.sql`ORDER BY RANDOM()` : Prisma.sql`ORDER BY i.full_name_lower`;

  const primaryPrefix = prefix.toLowerCase() + "%";

  const idRows = await prisma.$queryRaw<[{ id: string }]>(
    Prisma.sql`
      SELECT i.id FROM gedcom_individuals_v2 i
      WHERE i.file_uuid = ${fileUuid}::uuid
        AND (
          i.full_name_lower ~* ${pattern}
          OR i.primary_surname_lower LIKE ${primaryPrefix}
        )
      ${order}
      LIMIT ${limit}
    `,
  );
  return idRows.map((r) => r.id);
}

/**
 * Individuals linked to a catalog {@link GedcomSurname} row (schema: name form → surname junction).
 * Prefer this over {@link fetchIndividualIdsForSurnamePrefix} when a catalog id is known.
 */
export async function fetchIndividualIdsForSurnameId(
  surnameId: string,
  options?: { limit?: number; random?: boolean },
): Promise<string[]> {
  const limit = options?.limit ?? 100_000;
  const order = options?.random
    ? Prisma.sql`ORDER BY RANDOM()`
    : Prisma.sql`ORDER BY MIN(i.full_name_lower)`;

  const idRows = await prisma.$queryRaw<[{ id: string }]>(
    Prisma.sql`
      SELECT i.id
      FROM gedcom_individuals_v2 i
      INNER JOIN gedcom_individual_name_forms inf ON inf.individual_id = i.id
      INNER JOIN gedcom_name_form_surnames nfs ON nfs.name_form_id = inf.id
      WHERE nfs.surname_id = ${surnameId}::uuid
      GROUP BY i.id
      ${order}
      LIMIT ${limit}
    `,
  );
  return idRows.map((r) => r.id);
}

export async function countIndividualsForSurnameId(surnameId: string): Promise<number> {
  const rows = await prisma.$queryRaw<[{ c: number }]>(
    Prisma.sql`
      SELECT COUNT(DISTINCT i.id)::int AS c
      FROM gedcom_individuals_v2 i
      INNER JOIN gedcom_individual_name_forms inf ON inf.individual_id = i.id
      INNER JOIN gedcom_name_form_surnames nfs ON nfs.name_form_id = inf.id
      WHERE nfs.surname_id = ${surnameId}::uuid
    `,
  );
  return rows[0]?.c ?? 0;
}

/** Count individuals matching a surname prefix (same rules as {@link fetchIndividualIdsForSurnamePrefix}). */
export async function countIndividualsForSurnamePrefix(
  fileUuid: string,
  lastNamePrefix: string,
): Promise<number> {
  const prefix = stripSlashesFromName(lastNamePrefix);
  if (!prefix) return 0;
  const pattern = surnamePrefixRegexPattern(prefix);
  const primaryPrefix = prefix.toLowerCase() + "%";

  const rows = await prisma.$queryRaw<[{ c: number }]>(
    Prisma.sql`
      SELECT COUNT(*)::int AS c FROM gedcom_individuals_v2 i
      WHERE i.file_uuid = ${fileUuid}::uuid
        AND (
          i.full_name_lower ~* ${pattern}
          OR i.primary_surname_lower LIKE ${primaryPrefix}
        )
    `,
  );
  return rows[0]?.c ?? 0;
}
