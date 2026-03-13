import { NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";

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

    const count = await prisma.gedcomSurname.count({
      where: { fileUuid },
    });
    if (count === 0) {
      return NextResponse.json({ surname: null });
    }

    const skip = Math.floor(Math.random() * count);
    const surnames = await prisma.gedcomSurname.findMany({
      where: { fileUuid },
      select: {
        id: true,
        surname: true,
        frequency: true,
      },
      orderBy: { id: "asc" },
      take: 1,
      skip,
    });

    const surname = surnames[0]
      ? {
          id: surnames[0].id,
          surname: surnames[0].surname,
          frequency: surnames[0].frequency,
        }
      : null;

    return NextResponse.json({ surname });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
