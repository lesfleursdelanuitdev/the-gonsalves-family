import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/tree/advanced-search/general/route";

function req(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/tree/advanced-search/general");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

const EXPECTED_KEYS = ["people", "families", "events", "media", "surnames", "givenNames", "places", "notes"] as const;

function expectEmptyShape(json: unknown) {
  for (const key of EXPECTED_KEYS) {
    expect(json).toHaveProperty(key);
    const cat = (json as Record<string, { items: unknown[]; total: number }>)[key];
    expect(cat).toHaveProperty("items");
    expect(cat).toHaveProperty("total");
    expect(Array.isArray(cat!.items)).toBe(true);
  }
}

// ---------------------------------------------------------------------------
// No-database tests (run without DATABASE_URL)
// ---------------------------------------------------------------------------
describe("GET /api/tree/advanced-search/general — no database", () => {
  it("returns 503 when DATABASE_URL is not set and q is provided", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const res = await GET(req({ q: "Smith" }));
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json).toHaveProperty("error", "Database not configured");
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });

  it("returns 200 with all-empty result shape when q is missing (no DB needed)", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const res = await GET(req());
      expect(res.status).toBe(200);
      const json = await res.json();
      expectEmptyShape(json);
      for (const key of EXPECTED_KEYS) {
        const cat = (json as Record<string, { total: number }>)[key];
        expect(cat!.total).toBe(0);
      }
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });

  it("returns 200 with all-empty result shape when q is blank (no DB needed)", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const res = await GET(req({ q: "   " }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expectEmptyShape(json);
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });

  it("response always includes places and notes keys", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const res = await GET(req());
      const json = await res.json();
      expect(json).toHaveProperty("places");
      expect(json).toHaveProperty("notes");
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });
});

// ---------------------------------------------------------------------------
// Database-dependent tests (skipped when DATABASE_URL is absent)
// ---------------------------------------------------------------------------
describe("GET /api/tree/advanced-search/general — with database", () => {
  it("returns 200 with correct shape for a plain keyword search", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req({ q: "a" }));
    if (res.status === 404) return; // tree not loaded in this env
    expect(res.status).toBe(200);
    const json = await res.json();
    expectEmptyShape(json);
  });

  it("accepts comma-separated keywords without erroring", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req({ q: "Smith, Jones", matchType: "contains" }));
    if (res.status === 404) return;
    expect(res.status).toBe(200);
    const json = await res.json();
    expectEmptyShape(json);
  });

  it("accepts keywordLogic=and without erroring", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req({ q: "Smith, Cork", keywordLogic: "and" }));
    if (res.status === 404) return;
    expect(res.status).toBe(200);
    const json = await res.json();
    expectEmptyShape(json);
  });

  it("accepts keywordLogic=or without erroring", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req({ q: "Smith, Cork", keywordLogic: "or" }));
    if (res.status === 404) return;
    expect(res.status).toBe(200);
    const json = await res.json();
    expectEmptyShape(json);
  });

  it("defaults to or logic when keywordLogic is absent", async () => {
    if (!process.env.DATABASE_URL) return;
    const withLogic = await GET(req({ q: "a", keywordLogic: "or" }));
    const withoutLogic = await GET(req({ q: "a" }));
    if (withLogic.status === 404 || withoutLogic.status === 404) return;
    expect(withLogic.status).toBe(200);
    expect(withoutLogic.status).toBe(200);
    // Both should produce identical shaped responses
    const j1 = await withLogic.json();
    const j2 = await withoutLogic.json();
    for (const key of EXPECTED_KEYS) {
      expect((j1 as Record<string, { total: number }>)[key]!.total)
        .toBe((j2 as Record<string, { total: number }>)[key]!.total);
    }
  });

  it("places items have id, displayName, eventCount, and profileHref", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req({ q: "a" }));
    if (res.status !== 200) return;
    const json = await res.json() as { places: { items: unknown[] } };
    if (json.places.items.length === 0) return;
    const place = json.places.items[0] as Record<string, unknown>;
    expect(place).toHaveProperty("id");
    expect(place).toHaveProperty("displayName");
    expect(place).toHaveProperty("eventCount");
    expect(place).toHaveProperty("profileHref");
    expect(typeof place["profileHref"]).toBe("string");
    expect((place["profileHref"] as string).startsWith("/tree/places/")).toBe(true);
  });

  it("notes items have id, snippet, ownerName, and ownerHref", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req({ q: "a" }));
    if (res.status !== 200) return;
    const json = await res.json() as { notes: { items: unknown[] } };
    if (json.notes.items.length === 0) return;
    const note = json.notes.items[0] as Record<string, unknown>;
    expect(note).toHaveProperty("id");
    expect(note).toHaveProperty("snippet");
    // ownerName and ownerHref may be null (orphan notes) but must be present
    expect("ownerName" in note).toBe(true);
    expect("ownerHref" in note).toBe(true);
  });

  it("note snippets are at most 150 characters", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req({ q: "a" }));
    if (res.status !== 200) return;
    const json = await res.json() as { notes: { items: Array<{ snippet: string }> } };
    for (const note of json.notes.items) {
      expect(note.snippet.length).toBeLessThanOrEqual(150);
    }
  });

  it("place profileHref uses the place UUID (not xref)", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req({ q: "a" }));
    if (res.status !== 200) return;
    const json = await res.json() as { places: { items: Array<{ profileHref: string; id: string }> } };
    for (const place of json.places.items) {
      expect(place.profileHref).toContain(encodeURIComponent(place.id));
    }
  });

  it("returns at most 5 items per category", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req({ q: "a" }));
    if (res.status !== 200) return;
    const json = await res.json() as Record<string, { items: unknown[] }>;
    for (const key of EXPECTED_KEYS) {
      expect(json[key]!.items.length).toBeLessThanOrEqual(5);
    }
  });

  it("soundex match type is accepted for a multi-term query", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req({ q: "Smith, Jones", matchType: "soundex" }));
    if (res.status === 404) return;
    expect(res.status).toBe(200);
  });

  it("exact match type is accepted for a comma-separated query", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req({ q: "Smith, Jones", matchType: "exact" }));
    if (res.status === 404) return;
    expect(res.status).toBe(200);
  });
});
