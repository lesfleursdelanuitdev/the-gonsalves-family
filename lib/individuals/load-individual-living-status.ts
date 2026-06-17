import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";

export type IndividualPrivacyHint = {
  isLiving: boolean;
  birthYear: number | null;
  fullName: string | null;
  xref: string;
};

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

export async function loadIndividualPrivacyHintsByIds(
  ids: string[],
): Promise<Map<string, IndividualPrivacyHint>> {
  const fileUuid = await resolveTreeFileUuid();
  const hints = new Map<string, IndividualPrivacyHint>();
  if (!fileUuid || ids.length === 0) return hints;

  const uniqueIds = [...new Set(ids)];
  const rows = await prisma.gedcomIndividual.findMany({
    where: { fileUuid, id: { in: uniqueIds } },
    select: { id: true, isLiving: true, birthYear: true, fullName: true, xref: true },
  });

  for (const row of rows) {
    hints.set(row.id, {
      isLiving: row.isLiving,
      birthYear: row.birthYear ?? null,
      fullName: row.fullName ?? null,
      xref: row.xref,
    });
  }

  return hints;
}
