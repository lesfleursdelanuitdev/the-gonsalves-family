/**
 * Tree resolution for GEDCOM data.
 * Resolves "Gonsalves Family Tree" (tree1.ged) to its file UUID for Prisma queries.
 */

import { prisma } from "@/lib/database/prisma";
import { getCachedFileUuid, setCachedFileUuid } from "@/lib/tree-cache";

export const TREE_NAME = "Gonsalves Family Tree";

/**
 * Resolves the GEDCOM file UUID for the Gonsalves Family Tree (tree1.ged).
 * Returns null if the tree is not found in the database.
 * Cached in memory to avoid repeated DB queries.
 */
export async function resolveTreeFileUuid(): Promise<string | null> {
  const cached = getCachedFileUuid();
  if (cached !== undefined) return cached;

  const tree = await prisma.tree.findFirst({
    where: { name: TREE_NAME },
    select: { gedcomFileId: true },
  });
  const uuid = tree?.gedcomFileId ?? null;
  setCachedFileUuid(uuid);
  return uuid;
}
