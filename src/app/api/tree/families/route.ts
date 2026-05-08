import { NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    /** Do not join `gedcom_family_partners_v2`: the public read-only DB role often has no SELECT on that table. */
    const familyRows = await prisma.gedcomFamily.findMany({
      where: { fileUuid },
      select: {
        id: true,
        xref: true,
        husbandXref: true,
        wifeXref: true,
        husbandId: true,
        wifeId: true,
        marriageDateDisplay: true,
        marriagePlaceDisplay: true,
        isDivorced: true,
        childrenCount: true,
      },
    });

    const families = familyRows.map((f) => ({
      id: f.id,
      xref: f.xref,
      husbandXref: f.husbandXref,
      wifeXref: f.wifeXref,
      marriageDateDisplay: f.marriageDateDisplay,
      marriagePlaceDisplay: f.marriagePlaceDisplay,
      divorceDateDisplay: null as string | null,
      divorcePlaceDisplay: null as string | null,
      isDivorced: f.isDivorced,
      childrenCount: f.childrenCount ?? 0,
      partnerIndividualIds: [f.husbandId, f.wifeId].filter((id): id is string => id != null && id !== ""),
    }));

    return NextResponse.json({ families });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
