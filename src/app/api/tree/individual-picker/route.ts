import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
} from "@/lib/tree/individual-display-photo";
import { redactSearchIndividualForViewer } from "@/lib/auth/living-person-privacy";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";

const MAX_LIMIT = 25;

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10) || 12));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
    const firstToken = q.split(/\s+/).filter(Boolean)[0] ?? q;

    const rows = await prisma.gedcomIndividual.findMany({
      where: {
        fileUuid,
        ...(firstToken
          ? {
              OR: [
                { fullName: { contains: firstToken, mode: "insensitive" as const } },
                { xref: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        xref: true,
        fullName: true,
        birthDateDisplay: true,
        birthYear: true,
        isLiving: true,
      },
      orderBy: [{ fullNameLower: "asc" }, { xref: "asc" }],
      take: limit,
      skip: offset,
    });

    const photoMap = await batchIndividualDisplayPhotoMedia(
      prisma,
      fileUuid,
      rows.map((row) => row.id),
    );

    const viewer = await resolvePublicViewer();

    return NextResponse.json({
      individuals: rows.map((row) =>
        redactSearchIndividualForViewer(
          {
            id: row.id,
            xref: row.xref,
            fullName: displayName(row.fullName, row.xref),
            displayName: displayName(row.fullName, row.xref),
            birthYear: row.birthYear ?? null,
            isLiving: row.isLiving,
            birthDateLabel: row.birthDateDisplay ?? (row.birthYear ? String(row.birthYear) : null),
            portraitSrc: individualDisplayPhotoMediaToPublicUrl(photoMap.get(row.id)),
            profileHref: `/individuals/${encodeURIComponent(row.id)}`,
          },
          viewer,
        ),
      ),
      hasMore: rows.length === limit,
      nextOffset: offset + rows.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function displayName(fullName: string | null, xref: string) {
  const cleaned = fullName?.replace(/\//g, "").replace(/\s+/g, " ").trim();
  return cleaned || xref;
}
