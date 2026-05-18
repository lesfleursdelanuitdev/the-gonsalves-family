import { Prisma } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";

export function displayGivenName(givenName: string): string {
  return givenName.trim() || "Unknown";
}

/**
 * Individuals linked to a catalog {@link GedcomGivenName} row (name form → given-name junction).
 */
export async function fetchIndividualIdsForGivenNameId(
  givenNameId: string,
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
      INNER JOIN gedcom_name_form_given_names nfgn ON nfgn.name_form_id = inf.id
      WHERE nfgn.given_name_id = ${givenNameId}::uuid
      GROUP BY i.id
      ${order}
      LIMIT ${limit}
    `,
  );
  return idRows.map((r) => r.id);
}

/** Prefix match on catalog given-name tokens (case-insensitive). */
export async function fetchIndividualIdsForGivenNamePrefix(
  fileUuid: string,
  givenNamePrefix: string,
  options?: { limit?: number; random?: boolean },
): Promise<string[]> {
  const prefix = displayGivenName(givenNamePrefix).toLowerCase();
  if (!prefix) return [];
  const likePattern = prefix + "%";
  const limit = options?.limit ?? 100_000;
  const order = options?.random ? Prisma.sql`ORDER BY RANDOM()` : Prisma.sql`ORDER BY MIN(i.full_name_lower)`;

  const idRows = await prisma.$queryRaw<[{ id: string }]>(
    Prisma.sql`
      SELECT i.id
      FROM gedcom_individuals_v2 i
      INNER JOIN gedcom_individual_name_forms inf ON inf.individual_id = i.id
      INNER JOIN gedcom_name_form_given_names nfgn ON nfgn.name_form_id = inf.id
      INNER JOIN gedcom_given_names_v2 gn ON gn.id = nfgn.given_name_id
      WHERE i.file_uuid = ${fileUuid}::uuid
        AND gn.given_name_lower LIKE ${likePattern}
      GROUP BY i.id
      ${order}
      LIMIT ${limit}
    `,
  );
  return idRows.map((r) => r.id);
}

export async function countIndividualsForGivenNameId(givenNameId: string): Promise<number> {
  const rows = await prisma.$queryRaw<[{ c: number }]>(
    Prisma.sql`
      SELECT COUNT(DISTINCT i.id)::int AS c
      FROM gedcom_individuals_v2 i
      INNER JOIN gedcom_individual_name_forms inf ON inf.individual_id = i.id
      INNER JOIN gedcom_name_form_given_names nfgn ON nfgn.name_form_id = inf.id
      WHERE nfgn.given_name_id = ${givenNameId}::uuid
    `,
  );
  return rows[0]?.c ?? 0;
}

export async function countIndividualsForGivenNamePrefix(
  fileUuid: string,
  givenNamePrefix: string,
): Promise<number> {
  const prefix = displayGivenName(givenNamePrefix).toLowerCase();
  if (!prefix) return 0;
  const likePattern = prefix + "%";

  const rows = await prisma.$queryRaw<[{ c: number }]>(
    Prisma.sql`
      SELECT COUNT(DISTINCT i.id)::int AS c
      FROM gedcom_individuals_v2 i
      INNER JOIN gedcom_individual_name_forms inf ON inf.individual_id = i.id
      INNER JOIN gedcom_name_form_given_names nfgn ON nfgn.name_form_id = inf.id
      INNER JOIN gedcom_given_names_v2 gn ON gn.id = nfgn.given_name_id
      WHERE i.file_uuid = ${fileUuid}::uuid
        AND gn.given_name_lower LIKE ${likePattern}
    `,
  );
  return rows[0]?.c ?? 0;
}
