import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { guessContentType, resolveGedcomAdminDiskPath } from "@/lib/uploadsServe";

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
  const diskPath = resolveGedcomAdminDiskPath(normalizeSegments(raw));
  if (!diskPath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const st = await stat(diskPath);
    if (!st.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const segments = normalizeSegments(raw);
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
