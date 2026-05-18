import { NextResponse } from "next/server";
import { queryUpcomingEvents } from "@/lib/upcoming-anniversaries/query-upcoming-events";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const result = await queryUpcomingEvents();
    if (!result) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
