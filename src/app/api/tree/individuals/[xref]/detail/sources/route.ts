import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";
import { getPersonDetailContext, type Row } from "../lib";

export async function GET(
  req: NextRequest,
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

    const sourcesRows = await prisma.$queryRaw<Row[]>(
      Prisma.sql`
        SELECT s.id, s.xref, s.title, s.author, s.publication, s.text,
               ins.page, ins.quality, ins.citation_text
        FROM gedcom_individual_sources_v2 ins
        JOIN gedcom_sources_v2 s ON s.id = ins.source_id AND s.file_uuid = ins.file_uuid
        WHERE ins.file_uuid = ${fileUuid}::uuid AND ins.individual_id = ${personId}::uuid
      `
    );

    const sources = sourcesRows.map((r: Row) => ({
      source: {
        id: r.id,
        xref: r.xref,
        title: r.title ?? null,
        author: r.author ?? null,
        publication: r.publication ?? null,
        text: r.text ?? null,
      },
      page: r.page ?? null,
      quality: r.quality ?? null,
      citationText: r.citation_text ?? null,
    }));

    return NextResponse.json({ sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
