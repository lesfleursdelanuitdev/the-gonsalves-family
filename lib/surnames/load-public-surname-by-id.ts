import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { loadPublicIndividualsByIds } from "@/lib/individuals/load-public-individuals";
import {
  buildSurnameStatisticsForSurnameId,
} from "@/lib/surnames/build-surname-statistics";
import { publicIndividualsHrefForSurnameId } from "@/lib/surnames/individuals-href";
import {
  countIndividualsForSurnameId,
  displaySurname,
  fetchIndividualIdsForSurnameId,
} from "@/lib/surnames/surname-query";
import type { PublicSurnameProfile } from "@/components/surnames/types";

export async function loadPublicSurnameById(id: string): Promise<PublicSurnameProfile | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const row = await prisma.gedcomSurname.findFirst({
    where: { id, fileUuid },
    select: {
      id: true,
      surname: true,
      frequency: true,
      soundex: true,
      metaphone: true,
    },
  });
  if (!row) return null;

  const peopleCount = await countIndividualsForSurnameId(row.id);
  if (peopleCount === 0) return null;

  const label = displaySurname(row.surname);
  const [statistics, sampleIds] = await Promise.all([
    buildSurnameStatisticsForSurnameId(row.id),
    fetchIndividualIdsForSurnameId(row.id, { limit: 3, random: true }),
  ]);

  const samplePeople = await loadPublicIndividualsByIds(sampleIds);

  return {
    id: row.id,
    surname: row.surname,
    displaySurname: label,
    frequency: row.frequency,
    peopleCount,
    soundex: row.soundex,
    metaphone: row.metaphone,
    profileHref: `/surnames/${row.id}`,
    individualsHref: publicIndividualsHrefForSurnameId(row.id),
    statistics,
    samplePeople,
  };
}
