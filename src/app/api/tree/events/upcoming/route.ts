import { NextResponse } from "next/server";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { loadIndividualPrivacyHintsByIds } from "@/lib/individuals/load-individual-living-status";
import {
  collectUpcomingEventIndividualIds,
  redactUpcomingEventsForViewer,
} from "@/lib/upcoming-anniversaries/apply-upcoming-anniversary-living-privacy";
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

    const viewer = await resolvePublicViewer();
    const hints = await loadIndividualPrivacyHintsByIds(collectUpcomingEventIndividualIds(result.events));
    const events = redactUpcomingEventsForViewer(result.events, viewer, hints);

    return NextResponse.json({ window: result.window, events });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
