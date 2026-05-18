import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";

export type PublicRepository = {
  id: string;
  xref: string;
  name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

export async function loadPublicRepositories(): Promise<PublicRepository[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  return prisma.gedcomRepository.findMany({
    where: { fileUuid },
    orderBy: [{ name: "asc" }, { xref: "asc" }],
    select: {
      id: true,
      xref: true,
      name: true,
      city: true,
      state: true,
      country: true,
    },
  });
}
