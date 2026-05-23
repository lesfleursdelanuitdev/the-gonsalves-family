import { describe, expect, it } from "vitest";
import {
  dateLabelFromParts,
  dedupeTimelineByEventId,
  eventTitle,
  isPrimaryTimelineContext,
  sortTimeline,
  type TimelineBuildItem,
} from "@/lib/timeline/public-timeline";

// ── eventTitle ────────────────────────────────────────────────────────────────

describe("eventTitle", () => {
  it.each([
    ["BIRT", "Birth"],
    ["DEAT", "Death"],
    ["MARR", "Marriage"],
    ["BURI", "Burial"],
    ["RESI", "Residence"],
    ["OCCU", "Occupation"],
    ["IMMI", "Immigration"],
    ["EMIG", "Emigration"],
    ["DIV", "Divorce"],
    ["ANUL", "Annulment"],
  ])("maps %s → %s", (type, expected) => {
    expect(eventTitle(type, null)).toBe(expected);
  });

  it("is case-insensitive", () => {
    expect(eventTitle("birt", null)).toBe("Birth");
    expect(eventTitle("marr", null)).toBe("Marriage");
  });

  it("uses customType when eventType is unknown", () => {
    expect(eventTitle("CENS", "Census")).toBe("Census");
  });

  it("returns eventType when both customType and known mapping are missing", () => {
    expect(eventTitle("XYZ", null)).toBe("XYZ");
  });

  it("falls back to 'Life event' when eventType is null and customType is null", () => {
    expect(eventTitle(null, null)).toBe("Life event");
  });
});

// ── dateLabelFromParts ────────────────────────────────────────────────────────

describe("dateLabelFromParts", () => {
  it("prefers original string when present", () => {
    expect(dateLabelFromParts("15 Jan 1990", 1990)).toBe("15 Jan 1990");
  });

  it("falls back to year string when original is absent", () => {
    expect(dateLabelFromParts(null, 1990)).toBe("1990");
  });

  it("returns 'Undated' when both original and year are absent", () => {
    expect(dateLabelFromParts(null, null)).toBe("Undated");
    expect(dateLabelFromParts(undefined, undefined)).toBe("Undated");
  });

  it("ignores whitespace-only original", () => {
    expect(dateLabelFromParts("   ", 1990)).toBe("1990");
  });
});

// ── isPrimaryTimelineContext ──────────────────────────────────────────────────

describe("isPrimaryTimelineContext", () => {
  it("returns true for 'Personal event'", () => {
    expect(isPrimaryTimelineContext("Personal event")).toBe(true);
  });

  it("returns true for 'Family event'", () => {
    expect(isPrimaryTimelineContext("Family event")).toBe(true);
  });

  it("returns false for other contexts", () => {
    expect(isPrimaryTimelineContext("Related individual")).toBe(false);
    expect(isPrimaryTimelineContext("")).toBe(false);
  });
});

// ── helpers ───────────────────────────────────────────────────────────────────

function item(overrides: Partial<TimelineBuildItem> & { id: string; eventId: string }): TimelineBuildItem {
  return {
    id: overrides.id,
    eventId: overrides.eventId,
    dateLabel: overrides.dateLabel ?? "1900",
    title: overrides.title ?? "Birth",
    place: overrides.place ?? null,
    description: overrides.description ?? "",
    context: overrides.context ?? "Personal event",
    sortYear: overrides.sortYear ?? null,
    sortMonth: overrides.sortMonth ?? 0,
    sortDay: overrides.sortDay ?? 0,
    sortPriority: overrides.sortPriority ?? 0,
  };
}

// ── sortTimeline ──────────────────────────────────────────────────────────────

describe("sortTimeline", () => {
  it("sorts by year ascending", () => {
    const items = [
      item({ id: "b", eventId: "e2", sortYear: 1950 }),
      item({ id: "a", eventId: "e1", sortYear: 1900 }),
    ];
    const result = sortTimeline(items);
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("puts undated items (null year) last", () => {
    const items = [
      item({ id: "undated", eventId: "e1", sortYear: null }),
      item({ id: "dated", eventId: "e2", sortYear: 1900 }),
    ];
    const result = sortTimeline(items);
    expect(result.map((r) => r.id)).toEqual(["dated", "undated"]);
  });

  it("breaks year ties by month then day", () => {
    const items = [
      item({ id: "c", eventId: "e3", sortYear: 1900, sortMonth: 3, sortDay: 1 }),
      item({ id: "a", eventId: "e1", sortYear: 1900, sortMonth: 1, sortDay: 15 }),
      item({ id: "b", eventId: "e2", sortYear: 1900, sortMonth: 2, sortDay: 1 }),
    ];
    const result = sortTimeline(items);
    expect(result.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("breaks further ties by sortPriority", () => {
    const items = [
      item({ id: "low", eventId: "e2", sortYear: 1900, sortPriority: 2 }),
      item({ id: "high", eventId: "e1", sortYear: 1900, sortPriority: 1 }),
    ];
    const result = sortTimeline(items);
    expect(result.map((r) => r.id)).toEqual(["high", "low"]);
  });

  it("strips internal sort fields from returned objects", () => {
    const items = [item({ id: "x", eventId: "e1", sortYear: 1900 })];
    const result = sortTimeline(items);
    expect(result[0]).not.toHaveProperty("sortYear");
    expect(result[0]).not.toHaveProperty("eventId");
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("dateLabel");
    expect(result[0]).toHaveProperty("title");
    expect(result[0]).toHaveProperty("place");
    expect(result[0]).toHaveProperty("description");
    expect(result[0]).toHaveProperty("context");
  });
});

// ── dedupeTimelineByEventId ───────────────────────────────────────────────────

describe("dedupeTimelineByEventId", () => {
  it("returns items unchanged when all eventIds are unique", () => {
    const items = [
      item({ id: "a", eventId: "e1" }),
      item({ id: "b", eventId: "e2" }),
    ];
    expect(dedupeTimelineByEventId(items)).toHaveLength(2);
  });

  it("keeps first occurrence when duplicate is also non-family context", () => {
    const items = [
      item({ id: "first", eventId: "e1", context: "Personal event" }),
      item({ id: "second", eventId: "e1", context: "Related individual" }),
    ];
    const result = dedupeTimelineByEventId(items);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("first");
  });

  it("promotes family-context duplicate over earlier personal-context entry", () => {
    const items = [
      item({ id: "personal", eventId: "e1", context: "Personal event" }),
      item({ id: "family", eventId: "e1", context: "Family event" }),
    ];
    const result = dedupeTimelineByEventId(items);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("family");
  });

  it("does not replace family-context entry with a later family-context entry", () => {
    const items = [
      item({ id: "first-family", eventId: "e1", context: "Family event" }),
      item({ id: "second-family", eventId: "e1", context: "Family event" }),
    ];
    const result = dedupeTimelineByEventId(items);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("first-family");
  });
});
