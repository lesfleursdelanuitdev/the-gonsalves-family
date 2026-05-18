import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";

export type PublicSource = {
  id: string;
  xref: string;
  title: string | null;
  author: string | null;
  publication: string | null;
};

export async function loadPublicSources(): Promise<PublicSource[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  return prisma.gedcomSource.findMany({
    where: { fileUuid },
    orderBy: [{ title: "asc" }, { xref: "asc" }],
    select: {
      id: true,
      xref: true,
      title: true,
      author: true,
      publication: true,
    },
  });
}
