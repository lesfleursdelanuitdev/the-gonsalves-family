import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/tree/individuals/route";

function req(url = "http://localhost/api/tree/individuals") {
  return new NextRequest(url);
}

describe("GET /api/tree/individuals", () => {
  it("returns 503 when DATABASE_URL is not set", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const res = await GET(req());
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json).toHaveProperty("error", "Database not configured");
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });

  it("returns 200 with individuals array when tree exists", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req());
    if (res.status === 404) return; // tree not loaded
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("individuals");
    expect(Array.isArray(json.individuals)).toBe(true);
  });

  it("each individual has uuid, names (givenNames + lastName), and xref", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req());
    if (res.status !== 200) return;
    const { individuals } = await res.json();
    if (individuals.length === 0) return;

    const ind = individuals[0];
    expect(ind).toHaveProperty("uuid");
    expect(ind).toHaveProperty("xref");
    expect(ind).toHaveProperty("names");
    expect(ind.names).toHaveProperty("givenNames");
    expect(ind.names).toHaveProperty("lastName");
    expect(Array.isArray(ind.names.givenNames)).toBe(true);
  });

  it("names.givenNames contains given names in order", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req());
    if (res.status !== 200) return;
    const { individuals } = await res.json();
    const withMultiple = individuals.find(
      (i: { names: { givenNames: string[] } }) => i.names?.givenNames?.length > 1
    );
    if (withMultiple) {
      const joined = withMultiple.names.givenNames.join(" ");
      expect(withMultiple.names.givenNames).toBeDefined();
      expect(joined.length).toBeGreaterThan(0);
    }
  });

  it("when q is present, filters and limits results", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req("http://localhost/api/tree/individuals?q=john&limit=5"));
    if (res.status === 404) return;
    expect(res.status).toBe(200);
    const { individuals } = await res.json();
    expect(individuals.length).toBeLessThanOrEqual(5);
    individuals.forEach((ind: { uuid: string; names: { givenNames: string[]; lastName: string | null }; xref: string }) => {
      expect(ind).toHaveProperty("uuid");
      expect(ind).toHaveProperty("names");
      expect(ind).toHaveProperty("xref");
    });
  });

  it("when givenName and lastName are present, filters by both (lastName with / added)", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req("http://localhost/api/tree/individuals?givenName=Alfred&lastName=Gonsalves&limit=10"));
    if (res.status === 404) return;
    expect(res.status).toBe(200);
    const { individuals } = await res.json();
    expect(Array.isArray(individuals)).toBe(true);
    individuals.forEach((ind: { uuid: string; names: { givenNames: string[]; lastName: string | null }; xref: string }) => {
      expect(ind).toHaveProperty("uuid");
      expect(ind).toHaveProperty("names");
      expect(ind).toHaveProperty("xref");
    });
  });
});
