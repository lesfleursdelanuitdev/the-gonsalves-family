/**
 * Public story timeline events resolver.
 *
 * POST /api/story-timeline-events
 * Body: { rules: TimelineEventRule[]; filters?: { includeUndated?: boolean } }
 *
 * Resolves rule-based timeline sources for the public StoryViewer.
 * Currently supports: noteEvents
 *
 * Returns: { events: IndividualDetailEvent[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { sortEventsChronologically } from "@ligneous/timeline-view";
import type { IndividualDetailEvent } from "@ligneous/timeline-view";

type EventRule =
  | { kind: "noteEvents"; noteId: string; noteLabel?: string }
  | { kind: string; [key: string]: unknown };

type RequestBody = {
  rules?: unknown[];
  filters?: { includeUndated?: boolean };
};

function shapeEvent(ev: {
  id: string;
  eventType: string;
  customType: string | null;
  eventLabel: string | null;
  value: string | null;
  cause: string | null;
  sortOrder: number | null;
  date: { original: string | null; dateType: string | null; year: number | null; month: number | null; day: number | null } | null;
  place: { original: string | null; name: string | null } | null;
}): IndividualDetailEvent {
  return {
    eventId: ev.id,
    eventType: ev.eventType,
    customType: ev.customType,
    eventLabel: ev.eventLabel ?? null,
    value: ev.value,
    cause: ev.cause,
    dateOriginal: ev.date?.original ?? null,
    dateType: ev.date?.dateType ?? null,
    year: ev.date?.year ?? null,
    month: ev.date?.month ?? null,
    day: ev.date?.day ?? null,
    placeOriginal: ev.place?.original ?? null,
    placeName: ev.place?.name ?? null,
    sortOrder: ev.sortOrder ?? 0,
    source: "note",
    familyId: null,
    childXref: null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 503 });
    }

    const body = (await req.json()) as RequestBody;
    const rawRules = Array.isArray(body.rules) ? (body.rules as EventRule[]) : [];

    const seen = new Set<string>();
    const allEvents: IndividualDetailEvent[] = [];

    for (const rule of rawRules) {
      if (rule.kind === "noteEvents" && typeof rule.noteId === "string" && rule.noteId.trim()) {
        const noteId = rule.noteId.trim();

        // Verify the note belongs to this tree's file before serving its events.
        const note = await prisma.gedcomNote.findFirst({
          where: { id: noteId, fileUuid },
          select: { id: true },
        });
        if (!note) continue;

        const links = await prisma.gedcomEventNote.findMany({
          where: { noteId, fileUuid },
          include: {
            event: {
              include: {
                date: true,
                place: true,
              },
            },
          },
        });

        for (const link of links) {
          const ev = link.event;
          if (!ev || seen.has(ev.id)) continue;
          seen.add(ev.id);

          const includeUndated = body.filters?.includeUndated !== false;
          const hasDate = ev.date?.year != null || ev.date?.original?.trim();
          if (!includeUndated && !hasDate) continue;

          allEvents.push(shapeEvent(ev));
        }
      }
      // Future: add personEvents, familyEvents, relativeEvents here
    }

    const events = sortEventsChronologically(allEvents);
    return NextResponse.json({ events });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to resolve timeline events";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
