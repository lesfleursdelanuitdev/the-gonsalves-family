import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { guessContentType, resolveGedcomAdminDiskPath } from "@/lib/uploadsServe";
import { prisma } from "@/lib/database/prisma";
import { gateGedcomAdminUploadPath } from "@/lib/auth/living-exclusive-media";
import { resolveTreeFileUuid } from "@/lib/tree";

/**
 * Serves public GEDCOM media from disk for `/uploads/gedcom-admin/...`.
 * nginx fast-serves direct browser hits; this exists so Next's image optimizer
 * (which self-fetches local URLs over the loopback, bypassing nginx) can read them.
 */
function normalizeSegments(p: string | string[] | undefined): string[] {
  if (p == null) return [];
  return Array.isArray(p) ? p : [p];
}

export async function GET(_req: Request, ctx: { params: Promise<{ path?: string | string[] }> }) {
  const { path: raw } = await ctx.params;
  const segments = normalizeSegments(raw);
  const diskPath = resolveGedcomAdminDiskPath(segments);
  if (!diskPath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const fileUuid = await resolveTreeFileUuid();
  if (fileUuid) {
    const denied = await gateGedcomAdminUploadPath(prisma, fileUuid, segments);
    if (denied) return denied;
  }

  try {
    const st = await stat(diskPath);
    if (!st.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const basename = segments[segments.length - 1] ?? "file";
  const stream = createReadStream(diskPath);

  return new NextResponse(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
    status: 200,
    headers: {
      "Content-Type": guessContentType(basename),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
