/**
 * Find Pamela Ann Gonsalves in the tree (first name Pamela, last name Gonsalves, middle name Ann).
 * Run: npx tsx scripts/find-pamela.ts
 * (from the-gonsalves-family; requires .env.local with DATABASE_URL)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { resolveTreeFileUuid } from "../lib/tree";
import { prisma } from "../lib/database/prisma";
import { mapIndividualRow } from "../lib/individual-mapper";

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
    console.error("DATABASE_URL not set. Use .env.local");
    process.exit(1);
  }

  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) {
    console.error("Tree not found.");
    process.exit(1);
  }

  // Schema: GedcomIndividual has fullName + fullNameLower (indexed). GEDCOM format is "Given /Surname/".
  // First name Pamela, last name Gonsalves, middle name Ann → match fullNameLower containing all three.
  const rows = await prisma.gedcomIndividual.findMany({
    where: {
      fileUuid,
      AND: [
        { fullNameLower: { contains: "pamela" } },
        { fullNameLower: { contains: "ann" } },
        { fullNameLower: { contains: "gonsalves" } },
      ],
    },
    select: INDIVIDUAL_SELECT,
  });

  if (rows.length === 0) {
    console.log("No individual found: first name Pamela, last name Gonsalves, middle name Ann.");
    return;
  }

  console.log(`Found ${rows.length} individual(s) (Pamela Ann Gonsalves):\n`);
  for (const row of rows) {
    const m = mapIndividualRow(row);
    console.log({
      xref: m.xref,
      fullName: row.fullName,
      firstName: m.firstName,
      givenNames: m.givenNames,
      lastName: m.lastName,
      birth: m.birthDate,
      birthPlace: m.birthPlace,
      death: m.deathDate,
      deathPlace: m.deathPlace,
      isLiving: m.isLiving,
    });
    console.log("");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
