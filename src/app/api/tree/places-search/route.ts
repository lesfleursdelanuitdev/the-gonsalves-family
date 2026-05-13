import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { fullPlaceLabelFromGedcomPlace } from "@/lib/gedcom-place-display";
import { resolveTreeFileUuid } from "@/lib/tree";

const MAX_RESULTS = 50;

/**
 * Places for the resolved public tree file. Optional `q` filters by name, original text,
 * county, state, or country (case-insensitive contains). Without `q`, returns the first
 * chunk alphabetically for browsing.
 */
export async function GET(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();

    const rows = await prisma.gedcomPlace.findMany({
      where: {
        fileUuid,
        ...(q.length > 0
          ? {
              OR: [
                { original: { contains: q, mode: "insensitive" as const } },
                { name: { contains: q, mode: "insensitive" as const } },
                { county: { contains: q, mode: "insensitive" as const } },
                { state: { contains: q, mode: "insensitive" as const } },
                { country: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        original: true,
        name: true,
        county: true,
        state: true,
        country: true,
      },
      orderBy: [{ name: "asc" }, { original: "asc" }],
      take: MAX_RESULTS,
    });

    const places = rows.map((p) => ({
      id: p.id,
      name: fullPlaceLabelFromGedcomPlace(p) ?? "Place",
    }));

    return NextResponse.json({ places });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
