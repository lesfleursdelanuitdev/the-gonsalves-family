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

    const count = await prisma.gedcomPlace.count({
      where: { fileUuid },
    });
    if (count === 0) {
      return NextResponse.json({ place: null });
    }

    const skip = Math.floor(Math.random() * count);
    const places = await prisma.gedcomPlace.findMany({
      where: { fileUuid },
      select: {
        id: true,
        original: true,
        name: true,
        county: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { id: "asc" },
      take: 1,
      skip,
    });

    const place = places[0]
      ? {
          id: places[0].id,
          original: places[0].original,
          name: places[0].name,
          county: places[0].county,
          state: places[0].state,
          country: places[0].country,
          latitude: places[0].latitude,
          longitude: places[0].longitude,
        }
      : null;

    return NextResponse.json({ place });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
