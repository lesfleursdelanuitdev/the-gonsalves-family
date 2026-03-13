/**
 * One-off script: Find Aaron Peter Gonsalves and list his ancestors (3 generations).
 * Run: npx tsx --require tsconfig-paths/register scripts/find-ancestors.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { resolveTreeFileUuid } from "../lib/tree";
import { prisma } from "../lib/database/prisma";
import { mapIndividualRow } from "../lib/individual-mapper";
import {
  loadParentChildMaps,
  getAncestorIds,
} from "../lib/tree-ancestry";

const INDIVIDUAL_SELECT = {
  id: true,
  xref: true,
  fullName: true,
  birthDateDisplay: true,
  birthPlaceDisplay: true,
  deathDateDisplay: true,
  deathPlaceDisplay: true,
  isLiving: true,
  sex: true,
  gender: true,
  individualNameForms: {
    where: { isPrimary: true },
    take: 1,
    include: {
      givenNames: { include: { givenName: true }, orderBy: { position: "asc" as const } },
      surnames: { include: { surname: true }, orderBy: { position: "asc" as const } },
    },
  },
} as const;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set. Use .env.local or set the env var.");
    process.exit(1);
  }

  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) {
    console.error("Tree 'Gonsalves Family Tree' not found.");
    process.exit(1);
  }

  // Search for Aaron Peter Gonsalves (fullName often "Aaron Peter /Gonsalves/" or similar)
  const candidates = await prisma.gedcomIndividual.findMany({
    where: {
      fileUuid,
      OR: [
        { fullName: { contains: "Aaron", mode: "insensitive" } },
        { fullName: { contains: "Gonsalves", mode: "insensitive" } },
      ],
    },
    select: { id: true, xref: true, fullName: true },
  });

  // Narrow to Aaron Peter Gonsalves
  const aaron = candidates.find(
    (c) =>
      c.fullName &&
      /Aaron/i.test(c.fullName) &&
      /Peter/i.test(c.fullName) &&
      /Gonsalves/i.test(c.fullName)
  );

  if (!aaron) {
    console.log("Aaron Peter Gonsalves not found. Candidates with Aaron or Gonsalves:");
    for (const c of candidates.slice(0, 20)) {
      console.log(`  ${c.xref} ${c.fullName}`);
    }
    process.exit(1);
  }

  console.log("Found:", aaron.xref, aaron.fullName);
  console.log("");

  const { childToParents } = await loadParentChildMaps(fileUuid);
  const depthToIds = getAncestorIds(aaron.id, childToParents, 3);

  const allIds = new Set<string>();
  allIds.add(aaron.id);
  for (const ids of depthToIds.values()) {
    for (const id of ids) allIds.add(id);
  }

  const rows = await prisma.gedcomIndividual.findMany({
    where: { id: { in: Array.from(allIds) } },
    select: INDIVIDUAL_SELECT,
  });

  const byId = new Map(rows.map((r) => [r.id, r]));
  const result: Array<{ depth: number; name: string; xref: string; birth?: string; death?: string }> = [];

  result.push({
    depth: 0,
    name: mapIndividualRow(byId.get(aaron.id)!).firstName + " " + (mapIndividualRow(byId.get(aaron.id)!).lastName ?? ""),
    xref: aaron.xref,
    birth: mapIndividualRow(byId.get(aaron.id)!).birthDate ?? undefined,
    death: mapIndividualRow(byId.get(aaron.id)!).deathDate ?? undefined,
  });

  for (const [d, ids] of depthToIds.entries()) {
    for (const id of ids) {
      const row = byId.get(id);
      if (row) {
        const m = mapIndividualRow(row);
        result.push({
          depth: d,
          name: [m.firstName, m.lastName].filter(Boolean).join(" "),
          xref: row.xref,
          birth: m.birthDate ?? undefined,
          death: m.deathDate ?? undefined,
        });
      }
    }
  }

  result.sort((a, b) => a.depth - b.depth);

  console.log("Ancestors (3 generations, depth 0 = Aaron Peter Gonsalves):");
  console.log("");
  for (const r of result) {
    const indent = "  ".repeat(r.depth);
    const info = [r.name, r.birth ? `b. ${r.birth}` : null, r.death ? `d. ${r.death}` : null]
      .filter(Boolean)
      .join(" | ");
    console.log(`${indent}[${r.depth}] ${r.xref} ${info}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
