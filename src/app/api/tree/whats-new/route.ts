import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function GET() {
  try {
    const posts = await prisma.whatsNew.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        body: true,
        publishedAt: true,
        author: { select: { name: true, username: true } },
      },
    });
    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ error: "Could not load updates." }, { status: 503 });
  }
}
