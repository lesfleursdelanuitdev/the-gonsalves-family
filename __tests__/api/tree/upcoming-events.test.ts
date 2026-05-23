import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/tree/events/upcoming/route";

// ── mock ──────────────────────────────────────────────────────────────────────

const { queryUpcomingEventsMock } = vi.hoisted(() => ({
  queryUpcomingEventsMock: vi.fn(),
}));

vi.mock("@/lib/upcoming-anniversaries/query-upcoming-events", () => ({
  queryUpcomingEvents: queryUpcomingEventsMock,
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const SAMPLE_RESULT = {
  events: [
    { id: "e1", eventType: "BIRT", eventLabel: "Birth", date: null, place: null, individual: null, family: null },
  ],
  window: { start: { month: 5, day: 20 }, end: { month: 6, day: 20 } },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = "postgresql://test";
  queryUpcomingEventsMock.mockResolvedValue(SAMPLE_RESULT);
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/tree/events/upcoming", () => {
  it("returns 503 when DATABASE_URL is not set", async () => {
    delete process.env.DATABASE_URL;
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("Database not configured");
  });

  it("returns 404 when tree is not found (queryUpcomingEvents returns null)", async () => {
    queryUpcomingEventsMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  it("returns 200 with events result when tree is found", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(SAMPLE_RESULT);
  });

  it("returns 500 when queryUpcomingEvents throws", async () => {
    queryUpcomingEventsMock.mockRejectedValue(new Error("DB connection lost"));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("DB connection lost");
  });
});
