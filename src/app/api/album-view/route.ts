import { NextRequest, NextResponse } from "next/server";
import type { AlbumViewSource } from "@ligneous/album-view";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import {
  resolveCuratedAlbumViewModelPublic,
  resolveGeneratedAlbumViewModelPublic,
} from "@/lib/album/resolve-public-album-view-model";

function parseGeneratedSource(
  typeRaw: string | null,
  idRaw: string | null,
): Exclude<AlbumViewSource, { type: "album" }> | null {
  const id = idRaw?.trim() ?? "";
  if (!id) return null;
  const t = (typeRaw ?? "").trim().toLowerCase();
  switch (t) {
    case "individual":
      return { type: "individual", individualId: id };
    case "family":
      return { type: "family", familyId: id };
    case "event":
      return { type: "event", eventId: id };
    case "place":
      return { type: "place", placeId: id };
    case "note":
      return { type: "note", noteId: id };
    case "date":
      return { type: "date", dateId: id };
    case "tag":
      return { type: "tag", tagId: id };
    default:
      return null;
  }
}

/** Public album JSON for curated public albums and generated virtual albums (same tree as the site). */
export async function GET(request: NextRequest) {
  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not configured" }, { status: 503 });
    }

    const sp = request.nextUrl.searchParams;
    const kind = (sp.get("kind") ?? "").trim().toLowerCase();

    if (kind === "curated") {
      const albumId = sp.get("albumId")?.trim() ?? "";
      if (!albumId) {
        return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
      }
      const model = await resolveCuratedAlbumViewModelPublic(prisma, fileUuid, albumId);
      if (!model) return NextResponse.json({ error: "Album not found" }, { status: 404 });
      return NextResponse.json({ model });
    }

    if (kind === "generated") {
      const source = parseGeneratedSource(sp.get("type"), sp.get("id"));
      if (!source) {
        return NextResponse.json({ error: "Invalid or missing type / id for generated album" }, { status: 400 });
      }
      const model = await resolveGeneratedAlbumViewModelPublic(prisma, fileUuid, source);
      return NextResponse.json({ model });
    }

    return NextResponse.json({ error: "kind must be curated or generated" }, { status: 400 });
  } catch (err) {
    console.error("[api/album-view]", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Album view failed",
        detail,
      },
      { status: 500 },
    );
  }
}
