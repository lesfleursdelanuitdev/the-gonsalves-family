import { Prisma } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { publicIndividualsHrefForGivenNameId } from "@/lib/given-names/individuals-href";
import { displayGivenName } from "@/lib/given-names/given-name-query";
import type { PublicGivenName } from "@/components/given-names/types";

type GivenNameListRow = {
  id: string;
  given_name: string;
  given_name_lower: string;
  frequency: number;
  people_count: number;
};

/**
 * Public given-name catalog: only rows with at least one individual linked via
 * `gedcom_name_form_given_names` (see GedcomNameFormGivenName in schema).
 */
export async function loadPublicGivenNames(): Promise<PublicGivenName[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  const rows = await prisma.$queryRaw<GivenNameListRow[]>(
    Prisma.sql`
      SELECT
        gn.id,
        gn.given_name,
        gn.given_name_lower,
        gn.frequency,
        COUNT(DISTINCT inf.individual_id)::int AS people_count
      FROM gedcom_given_names_v2 gn
      INNER JOIN gedcom_name_form_given_names nfgn ON nfgn.given_name_id = gn.id
      INNER JOIN gedcom_individual_name_forms inf
        ON inf.id = nfgn.name_form_id
        AND inf.file_uuid = gn.file_uuid
      WHERE gn.file_uuid = ${fileUuid}::uuid
      GROUP BY gn.id, gn.given_name, gn.given_name_lower, gn.frequency
      HAVING COUNT(DISTINCT inf.individual_id) > 0
      ORDER BY gn.given_name_lower ASC
    `,
  );

  return rows.map((row) => {
    const label = displayGivenName(row.given_name);
    return {
      id: row.id,
      givenName: row.given_name,
      displayGivenName: label,
      frequency: row.frequency,
      peopleCount: row.people_count,
      profileHref: `/given-names/${row.id}`,
      individualsHref: publicIndividualsHrefForGivenNameId(row.id),
    };
  });
}
