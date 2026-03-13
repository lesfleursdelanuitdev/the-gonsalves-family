/**
 * Example API route: list public trees (read-only).
 * Demonstrates using @ligneous/prisma with the ligneous_frontend database.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured", trees: [] },
      { status: 503 }
    );
  }
  try {
    const trees = await prisma.tree.findMany({
      where: { isPublic: true },
      select: { id: true, name: true, description: true, fileId: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ trees });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
