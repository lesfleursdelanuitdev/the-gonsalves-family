import { IndividualsPage } from "@/components/individuals/IndividualsPage";
import { loadPublicIndividuals } from "@/lib/individuals/load-public-individuals";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { displayGivenName } from "@/lib/given-names/given-name-query";
import { displaySurname } from "@/lib/surnames/surname-query";

type SearchParams = Promise<{
  lastName?: string;
  surnameId?: string;
  givenName?: string;
  givenNameId?: string;
}>;

export default async function IndividualsRoutePage({ searchParams }: { searchParams: SearchParams }) {
  const { lastName, surnameId, givenName, givenNameId } = await searchParams;
  const trimmedSurnameId = surnameId?.trim() || undefined;
  const trimmedLastName = lastName?.trim() || undefined;
  const trimmedGivenNameId = givenNameId?.trim() || undefined;
  const trimmedGivenName = givenName?.trim() || undefined;

  let individuals;
  let initialLastName: string | undefined;
  let initialSurnameId: string | undefined;
  let initialGivenName: string | undefined;
  let initialGivenNameId: string | undefined;

  const fileUuid = await resolveTreeFileUuid();

  if (trimmedGivenNameId) {
    individuals = await loadPublicIndividuals({ givenNameId: trimmedGivenNameId });
    initialGivenNameId = trimmedGivenNameId;
    if (fileUuid) {
      const row = await prisma.gedcomGivenName.findFirst({
        where: { id: trimmedGivenNameId, fileUuid },
        select: { givenName: true },
      });
      initialGivenName = row ? displayGivenName(row.givenName) : undefined;
    }
  } else if (trimmedSurnameId) {
    individuals = await loadPublicIndividuals({ surnameId: trimmedSurnameId });
    initialSurnameId = trimmedSurnameId;
    if (fileUuid) {
      const row = await prisma.gedcomSurname.findFirst({
        where: { id: trimmedSurnameId, fileUuid },
        select: { surname: true },
      });
      initialLastName = row ? displaySurname(row.surname) : undefined;
    }
  } else if (trimmedGivenName) {
    individuals = await loadPublicIndividuals({ givenName: trimmedGivenName });
    initialGivenName = trimmedGivenName;
  } else {
    individuals = await loadPublicIndividuals(trimmedLastName ? { lastName: trimmedLastName } : undefined);
    initialLastName = trimmedLastName;
  }

  return (
    <IndividualsPage
      individuals={individuals}
      initialLastName={initialLastName}
      initialSurnameId={initialSurnameId}
      initialGivenName={initialGivenName}
      initialGivenNameId={initialGivenNameId}
    />
  );
}
