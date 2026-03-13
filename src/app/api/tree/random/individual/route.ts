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

    const count = await prisma.gedcomIndividual.count({
      where: { fileUuid },
    });
    if (count === 0) {
      return NextResponse.json({ individual: null });
    }

    const skip = Math.floor(Math.random() * count);
    const rows = await prisma.gedcomIndividual.findMany({
      where: { fileUuid },
      select: individualSelect,
      orderBy: { id: "asc" },
      take: 1,
      skip,
    });

    const individual = rows[0] ? mapIndividualRow(rows[0]) : null;
    return NextResponse.json({ individual });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
