import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";

export async function loadIndividualLivingStatus(id: string): Promise<{ isLiving: boolean } | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const row = await prisma.gedcomIndividual.findFirst({
    where: { id, fileUuid },
    select: { isLiving: true },
  });
  if (!row) return null;
  return { isLiving: row.isLiving };
}
