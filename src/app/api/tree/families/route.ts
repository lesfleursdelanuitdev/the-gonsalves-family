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
    });

    return NextResponse.json({ families });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
