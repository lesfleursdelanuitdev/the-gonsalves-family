import { NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { mapIndividualRow } from "@/lib/individual-mapper";

const individualSelect = {
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
      givenNames: {
        include: { givenName: true },
        orderBy: { position: "asc" as const },
      },
      surnames: {
        include: { surname: true },
        orderBy: { position: "asc" as const },
      },
    },
  },
} as const;

function displayName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "";
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const count = await prisma.gedcomFamily.count({
      where: { fileUuid },
    });
    if (count === 0) {
      return NextResponse.json({ family: null });
    }

    const skip = Math.floor(Math.random() * count);
    const families = await prisma.gedcomFamily.findMany({
      where: { fileUuid },
      select: {
        id: true,
        xref: true,
        husbandXref: true,
        wifeXref: true,
        marriageDateDisplay: true,
        marriagePlaceDisplay: true,
        isDivorced: true,
        childrenCount: true,
      },
      orderBy: { id: "asc" },
      take: 1,
      skip,
    });

    const row = families[0];
    if (!row) {
      return NextResponse.json({ family: null });
    }

    const xrefs = [row.husbandXref, row.wifeXref].filter(
      (x): x is string => x != null && x !== ""
    );
    let husbandName = "";
    let wifeName = "";

    if (xrefs.length > 0) {
      const individuals = await prisma.gedcomIndividual.findMany({
        where: { fileUuid, xref: { in: xrefs } },
        select: individualSelect,
      });
      const byXref = new Map(
        individuals.map((r) => [r.xref, mapIndividualRow(r)])
      );
      husbandName = row.husbandXref
        ? displayName(
            byXref.get(row.husbandXref)?.firstName ?? null,
            byXref.get(row.husbandXref)?.lastName ?? null
          )
        : "";
      wifeName = row.wifeXref
        ? displayName(
            byXref.get(row.wifeXref)?.firstName ?? null,
            byXref.get(row.wifeXref)?.lastName ?? null
          )
        : "";
    }

    const family = {
      id: row.id,
      xref: row.xref,
      husbandXref: row.husbandXref,
      wifeXref: row.wifeXref,
      marriageDateDisplay: row.marriageDateDisplay,
      marriagePlaceDisplay: row.marriagePlaceDisplay,
      divorceDateDisplay: null,
      divorcePlaceDisplay: null,
      isDivorced: row.isDivorced,
      childrenCount: row.childrenCount ?? 0,
      husbandName: husbandName || null,
      wifeName: wifeName || null,
    };

    return NextResponse.json({ family });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
