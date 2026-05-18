import { Prisma } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { publicIndividualsHrefForSurnameId } from "@/lib/surnames/individuals-href";
import { displaySurname } from "@/lib/surnames/surname-query";
import type { PublicSurname } from "@/components/surnames/types";

type SurnameListRow = {
  id: string;
  surname: string;
  surname_lower: string;
  frequency: number;
  people_count: number;
};

/**
 * Public surname catalog: only rows with at least one individual linked via
 * `gedcom_name_form_surnames` (see GedcomNameFormSurname in schema).
 */
export async function loadPublicSurnames(): Promise<PublicSurname[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  const rows = await prisma.$queryRaw<SurnameListRow[]>(
    Prisma.sql`
      SELECT
        sn.id,
        sn.surname,
        sn.surname_lower,
        sn.frequency,
        COUNT(DISTINCT inf.individual_id)::int AS people_count
      FROM gedcom_surnames_v2 sn
      INNER JOIN gedcom_name_form_surnames nfs ON nfs.surname_id = sn.id
      INNER JOIN gedcom_individual_name_forms inf
        ON inf.id = nfs.name_form_id
        AND inf.file_uuid = sn.file_uuid
      WHERE sn.file_uuid = ${fileUuid}::uuid
      GROUP BY sn.id, sn.surname, sn.surname_lower, sn.frequency
      HAVING COUNT(DISTINCT inf.individual_id) > 0
      ORDER BY sn.surname_lower ASC
    `,
  );

  return rows.map((row) => {
    const label = displaySurname(row.surname);
    return {
      id: row.id,
      surname: row.surname,
      displaySurname: label,
      frequency: row.frequency,
      peopleCount: row.people_count,
      profileHref: `/surnames/${row.id}`,
      individualsHref: publicIndividualsHrefForSurnameId(row.id),
    };
  });
}
