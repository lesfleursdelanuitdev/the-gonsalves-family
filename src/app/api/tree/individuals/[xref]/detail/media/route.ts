import { NextRequest, NextResponse } from "next/server";
import { collectMediaIdsForGenerated } from "@ligneous/album-generated-queries";
import { prisma } from "@/lib/database/prisma";
import { batchIndividualDisplayPhotoMedia } from "@/lib/tree/individual-display-photo";
import { getPersonDetailContext } from "../lib";

/**
 * GET — profile OBJE (if any), three random linked OBJEs (excluding profile for variety),
 * total count, and album title aligned with {@link collectMediaIdsForGenerated}.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ xref: string }> }
) {
  try {
    const { xref } = await params;
    const ctx = await getPersonDetailContext(xref);
    if (!ctx) {
      const code = !process.env.DATABASE_URL ? 503 : 404;
      return NextResponse.json(
        { error: code === 503 ? "Database not configured" : "Person not found" },
        { status: code }
      );
    }

    const { fileUuid, personId } = ctx;

    const displayPhotoMap = await batchIndividualDisplayPhotoMedia(prisma, fileUuid, [personId]);
    const displayPhotoRow = displayPhotoMap.get(personId) ?? null;

    const collected = await collectMediaIdsForGenerated(prisma, fileUuid, {
      type: "individual",
      individualId: personId,
    });

    const uniqueIds = [...new Set(collected.mediaIds)];
    const profileId = collected.preferredCoverMediaId;
    const poolForRandom = profileId ? uniqueIds.filter((id) => id !== profileId) : [...uniqueIds];
    const shuffled = [...poolForRandom];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    const sampleIds = shuffled.slice(0, 3);
    const fetchIds = [...new Set([...(profileId ? [profileId] : []), ...sampleIds])];
    if (fetchIds.length === 0) {
      return NextResponse.json({
        individualId: personId,
        albumTitle: collected.title,
        totalCount: 0,
        profile: null,
        displayPhoto: displayPhotoRow
          ? {
              id: displayPhotoRow.id,
              title: displayPhotoRow.title,
              fileRef: displayPhotoRow.fileRef,
              form: displayPhotoRow.form,
            }
          : null,
        samples: [],
      });
    }

    const rows = await prisma.gedcomMedia.findMany({
      where: { id: { in: fetchIds }, fileUuid },
      select: { id: true, title: true, fileRef: true, form: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const profile = profileId ? (byId.get(profileId) ?? null) : null;
    const samples = sampleIds
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => r != null);

    return NextResponse.json({
      individualId: personId,
      albumTitle: collected.title,
      totalCount: uniqueIds.length,
      profile: profile
        ? { id: profile.id, title: profile.title, fileRef: profile.fileRef, form: profile.form }
        : null,
      /** Profile raster or stable linked raster for header/cards (same rule as chart `photoUrl`). */
      displayPhoto: displayPhotoRow
        ? {
            id: displayPhotoRow.id,
            title: displayPhotoRow.title,
            fileRef: displayPhotoRow.fileRef,
            form: displayPhotoRow.form,
          }
        : null,
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
