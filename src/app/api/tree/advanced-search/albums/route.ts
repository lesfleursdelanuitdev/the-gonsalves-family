import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeId } from "@/lib/tree";

/** Albums belonging to the public tree, searchable by name. */
export async function GET(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const treeId = await resolveTreeId();
    if (!treeId) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const q = (new URL(req.url).searchParams.get("q") ?? "").trim();

    const albums = await prisma.album.findMany({
      where: {
        treeId,
        ...(q.length >= 1 ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 20,
    });

    return NextResponse.json({ albums });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
