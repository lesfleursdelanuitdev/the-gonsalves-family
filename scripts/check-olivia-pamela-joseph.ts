/**
 * Check whether Olivia Paige Ferreira is listed as a child of the union of
 * Pamela Ann Gonsalves and Joseph Ferreira.
 * Run: npx tsx scripts/check-olivia-pamela-joseph.ts
 * (from the-gonsalves-family; requires .env.local with DATABASE_URL)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { resolveTreeFileUuid } from "../lib/tree";
import { prisma } from "../lib/database/prisma";

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

  // Schema: GedcomIndividual has fullNameLower (indexed). GEDCOM fullName is "Given /Surname/".
  // 1. Find Olivia Paige Ferreira (fullNameLower e.g. "olivia paige /ferreira/")
  const olivia = await prisma.gedcomIndividual.findFirst({
    where: {
      fileUuid,
      AND: [
        { fullNameLower: { contains: "olivia" } },
        { fullNameLower: { contains: "ferreira" } },
      ],
    },
    select: { id: true, xref: true, fullName: true, birthDateDisplay: true, birthPlaceDisplay: true },
  });

  // 2. Find Pamela Ann Gonsalves: first name Pamela, last name Gonsalves, middle name Ann (fullNameLower has all three)
  const pamela =
    (await prisma.gedcomIndividual.findFirst({
      where: { fileUuid, xref: "@I0143@" },
      select: { id: true, xref: true, fullName: true },
    })) ??
    (await prisma.gedcomIndividual.findFirst({
      where: {
        fileUuid,
        AND: [
          { fullNameLower: { contains: "pamela" } },
          { fullNameLower: { contains: "ann" } },
          { fullNameLower: { contains: "gonsalves" } },
        ],
      },
      select: { id: true, xref: true, fullName: true },
    }));

  // 3. Find Joseph Ferreira (fullNameLower e.g. "joseph /ferreira/")
  const joseph = await prisma.gedcomIndividual.findFirst({
    where: {
      fileUuid,
      AND: [
        { fullNameLower: { contains: "joseph" } },
        { fullNameLower: { contains: "ferreira" } },
      ],
    },
    select: { id: true, xref: true, fullName: true },
  });

  console.log("--- Individuals ---");
  console.log("Olivia Paige Ferreira:", olivia ? { xref: olivia.xref, fullName: olivia.fullName, birth: olivia.birthDateDisplay, place: olivia.birthPlaceDisplay } : "NOT FOUND");
  console.log("Pamela (Gonsalves):", pamela ? { xref: pamela.xref, fullName: pamela.fullName } : "NOT FOUND");
  console.log("Joseph Ferreira:", joseph ? { xref: joseph.xref, fullName: joseph.fullName } : "NOT FOUND");
  console.log("");

  if (!pamela || !joseph) {
    console.log("Cannot check union: Pamela or Joseph not found.");
    return;
  }

  // 4. Find family (union) where husband and wife are Joseph and Pamela (order may vary)
  const families = await prisma.gedcomFamily.findMany({
    where: {
      fileUuid,
      OR: [
        { husbandXref: joseph.xref, wifeXref: pamela.xref },
        { husbandXref: pamela.xref, wifeXref: joseph.xref },
      ],
    },
    select: { id: true, xref: true, husbandXref: true, wifeXref: true },
  });

  console.log("--- Union (Pamela + Joseph) ---");
  if (families.length === 0) {
    console.log("No family record found with Pamela and Joseph as spouses.");
    return;
  }
  for (const fam of families) {
    console.log("Family xref:", fam.xref, "| husbandXref:", fam.husbandXref, "| wifeXref:", fam.wifeXref);
  }
  console.log("");

  // 5. For each such family, list children and check for Olivia
  for (const fam of families) {
    const links = await prisma.gedcomParentChild.findMany({
      where: { fileUuid, familyId: fam.id },
      select: { childId: true },
    });
    const childIds = [...new Set(links.map((l) => l.childId))];
    const children = await prisma.gedcomIndividual.findMany({
      where: { id: { in: childIds } },
      select: { id: true, xref: true, fullName: true },
    });
    console.log("Children of this union:", children.map((c) => c.fullName + " (" + c.xref + ")").join(", ") || "(none)");
    const oliviaInUnion = olivia && childIds.includes(olivia.id);
    console.log("Is Olivia Paige Ferreira listed as a child of this union?", oliviaInUnion ? "YES" : "NO");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
