import { NextRequest, NextResponse } from "next/server";
import { collectMediaIdsForGenerated } from "@ligneous/album-generated-queries";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";

/**
 * GET — three random linked family OBJEs and total count for album preview.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: familyId } = await params;
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json(
        { error: !process.env.DATABASE_URL ? "Database not configured" : "Tree not found" },
        { status: !process.env.DATABASE_URL ? 503 : 404 },
      );
    }

    const family = await prisma.gedcomFamily.findFirst({
      where: { id: familyId, fileUuid },
      select: { id: true },
    });
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    const collected = await collectMediaIdsForGenerated(prisma, fileUuid, {
      type: "family",
      familyId,
    });

    const uniqueIds = [...new Set(collected.mediaIds)];
    const profileId = collected.preferredCoverMediaId;
    const poolForRandom = profileId ? uniqueIds.filter((mid) => mid !== profileId) : [...uniqueIds];
    const shuffled = [...poolForRandom];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    const sampleIds = shuffled.slice(0, 3);
    const fetchIds = [...new Set([...(profileId ? [profileId] : []), ...sampleIds])];

    if (fetchIds.length === 0) {
      return NextResponse.json({
        familyId,
        albumTitle: collected.title,
        totalCount: 0,
        samples: [],
      });
    }

    const rows = await prisma.gedcomMedia.findMany({
      where: { id: { in: fetchIds }, fileUuid },
      select: { id: true, title: true, fileRef: true, form: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const samples = sampleIds
      .map((mid) => byId.get(mid))
      .filter((r): r is NonNullable<typeof r> => r != null);

    return NextResponse.json({
      familyId,
      albumTitle: collected.title,
      totalCount: uniqueIds.length,
      samples: samples.map((m) => ({
        id: m.id,
        title: m.title,
        fileRef: m.fileRef,
        form: m.form,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
