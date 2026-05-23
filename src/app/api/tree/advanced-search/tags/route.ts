import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid, resolveTreeId } from "@/lib/tree";

/** Tags applied to any media (GedcomMedia, SiteMedia, UserMedia, Story) in the public tree. */
export async function GET(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const [fileUuid, treeId] = await Promise.all([resolveTreeFileUuid(), resolveTreeId()]);
    if (!fileUuid || !treeId) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const q = (new URL(req.url).searchParams.get("q") ?? "").trim();

    const tags = await prisma.tag.findMany({
      where: {
        ...(q.length >= 1 ? { name: { contains: q, mode: "insensitive" } } : {}),
        OR: [
          { gedcomMediaAppTags: { some: { gedcomMedia: { fileUuid } } } },
          { siteMediaTags:      { some: { siteMedia:  { treeId } } } },
          { userMediaTags:      { some: { userMedia:  { treeId } } } },
          { storyTags:          { some: { story:      { treeId, deletedAt: null } } } },
        ],
      },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json({ tags });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
