import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";

const MAX_RESULTS = 50;

/**
 * Tags that appear on GEDCOM media (or have profile media) for the resolved public tree file.
 * Optional `q` query filters by name (case-insensitive contains).
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

    const tags = await prisma.tag.findMany({
      where: {
        OR: [
          {
            gedcomMediaAppTags: {
              some: { gedcomMedia: { fileUuid } },
            },
          },
          {
            profileMediaRows: {
              some: { fileUuid },
            },
          },
        ],
        ...(q.length > 0
          ? {
              name: {
                contains: q,
                mode: "insensitive" as const,
              },
            }
          : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: MAX_RESULTS,
    });

    return NextResponse.json({ tags });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
