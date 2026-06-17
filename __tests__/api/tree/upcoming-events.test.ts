import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/tree/events/upcoming/route";

// ── mock ──────────────────────────────────────────────────────────────────────

const { queryUpcomingEventsMock, resolvePublicViewerMock, loadIndividualPrivacyHintsByIdsMock } =
  vi.hoisted(() => ({
    queryUpcomingEventsMock: vi.fn(),
    resolvePublicViewerMock: vi.fn(),
    loadIndividualPrivacyHintsByIdsMock: vi.fn(),
  }));

vi.mock("@/lib/upcoming-anniversaries/query-upcoming-events", () => ({
  queryUpcomingEvents: queryUpcomingEventsMock,
}));

vi.mock("@/lib/auth/public-viewer-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/public-viewer-context")>();
  return {
    ...actual,
    resolvePublicViewer: resolvePublicViewerMock,
  };
});

vi.mock("@/lib/individuals/load-individual-living-status", () => ({
  loadIndividualPrivacyHintsByIds: loadIndividualPrivacyHintsByIdsMock,
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const SAMPLE_RESULT = {
  events: [
    {
      id: "e1",
      eventType: "BIRT",
      eventLabel: "Birth",
      date: null,
      place: { original: "Honolulu", name: "Honolulu" },
      individual: { id: "p1", xref: "@I1@", fullName: "Jane /Doe/" },
      family: null,
    },
  ],
  window: { start: { month: 5, day: 20 }, end: { month: 6, day: 20 } },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = "postgresql://test";
  queryUpcomingEventsMock.mockResolvedValue(SAMPLE_RESULT);
  resolvePublicViewerMock.mockResolvedValue({ kind: "anonymous" });
  loadIndividualPrivacyHintsByIdsMock.mockResolvedValue(
    new Map([
      [
        "p1",
        {
          isLiving: true,
          birthYear: 1990,
          fullName: "Jane /Doe/",
          xref: "@I1@",
        },
      ],
    ]),
  );
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

  it("returns 200 with redacted events result when tree is found", async () => {
    const res = await GET();
    const body = await res.json();
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(body)}`);
    }
    expect(body.window).toEqual(SAMPLE_RESULT.window);
    expect(body.events[0]?.individual?.fullName).toBe("Jane Doe · b. 1990");
    expect(body.events[0]?.place).toBeNull();
  });

  it("returns 500 when queryUpcomingEvents throws", async () => {
    queryUpcomingEventsMock.mockRejectedValue(new Error("DB connection lost"));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("DB connection lost");
  });
});
