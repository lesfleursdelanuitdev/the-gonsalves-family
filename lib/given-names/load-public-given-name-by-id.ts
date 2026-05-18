import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { loadPublicIndividualsByIds } from "@/lib/individuals/load-public-individuals";
import { buildGivenNameStatisticsForGivenNameId } from "@/lib/given-names/build-given-name-statistics";
import { publicIndividualsHrefForGivenNameId } from "@/lib/given-names/individuals-href";
import {
  countIndividualsForGivenNameId,
  displayGivenName,
  fetchIndividualIdsForGivenNameId,
} from "@/lib/given-names/given-name-query";
import type { PublicGivenNameProfile } from "@/components/given-names/types";

export async function loadPublicGivenNameById(id: string): Promise<PublicGivenNameProfile | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const row = await prisma.gedcomGivenName.findFirst({
    where: { id, fileUuid },
    select: {
      id: true,
      givenName: true,
      frequency: true,
    },
  });
  if (!row) return null;

  const peopleCount = await countIndividualsForGivenNameId(row.id);
  if (peopleCount === 0) return null;

  const label = displayGivenName(row.givenName);
  const [statistics, sampleIds] = await Promise.all([
    buildGivenNameStatisticsForGivenNameId(row.id),
    fetchIndividualIdsForGivenNameId(row.id, { limit: 3, random: true }),
  ]);

  const samplePeople = await loadPublicIndividualsByIds(sampleIds);

  return {
    id: row.id,
    givenName: row.givenName,
    displayGivenName: label,
    frequency: row.frequency,
    peopleCount,
    profileHref: `/given-names/${row.id}`,
    individualsHref: publicIndividualsHrefForGivenNameId(row.id),
    statistics,
    samplePeople,
  };
}
