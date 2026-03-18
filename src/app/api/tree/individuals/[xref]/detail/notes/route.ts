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

    const notesRows = await prisma.$queryRaw<Row[]>(
      Prisma.sql`
        SELECT n.id, n.xref, n.content
        FROM gedcom_individual_notes_v2 in_
        JOIN gedcom_notes_v2 n ON n.id = in_.note_id AND n.file_uuid = in_.file_uuid
        WHERE in_.file_uuid = ${fileUuid}::uuid AND in_.individual_id = ${personId}::uuid
      `
    );

    const notes = notesRows.map((r: Row) => ({
      id: r.id,
      xref: r.xref ?? null,
      content: r.content,
    }));

    return NextResponse.json({ notes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
