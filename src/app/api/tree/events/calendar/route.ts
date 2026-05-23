import { NextRequest, NextResponse } from "next/server";
import { queryCalendarEvents } from "@/lib/calendar/query-calendar-events";

export async function GET(req: NextRequest) {
  const month = parseInt(new URL(req.url).searchParams.get("month") ?? "0", 10);
  if (!month || month < 1 || month > 12) {
    return NextResponse.json({ error: "month param required (1–12)" }, { status: 400 });
  }

  const byDay = await queryCalendarEvents(month);
  if (!byDay) {
    return NextResponse.json({ error: "Tree not available" }, { status: 503 });
  }

  return NextResponse.json({ month, days: byDay });
}
