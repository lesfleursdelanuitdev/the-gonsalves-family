import { NextResponse } from "next/server";
import { resolveTreeFileUuid, resolveTreeId } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { buildHomeStatisticsPayload } from "@/lib/home-statistics-query";

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }
  try {
    const url = new URL(request.url);
    const rRaw = url.searchParams.get("r");
    const rParsed = rRaw != null && rRaw !== "" ? Number.parseInt(rRaw, 10) : NaN;
    const analyticsSeed = Number.isFinite(rParsed) && rParsed > 0 ? rParsed : null;

    const [fileUuid, treeId] = await Promise.all([resolveTreeFileUuid(), resolveTreeId()]);
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }
    const payload = await buildHomeStatisticsPayload(prisma, fileUuid, {
      analyticsSeed,
      treeId: analyticsSeed != null ? treeId : null,
    });
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
