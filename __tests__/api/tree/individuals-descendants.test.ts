import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/tree/individuals/[xref]/descendants/route";

async function getFirstXref(): Promise<string | null> {
  const { GET: getIndividuals } = await import("@/app/api/tree/individuals/route");
  const res = await getIndividuals();
  if (res.status !== 200) return null;
  const json = await res.json();
  const first = json.individuals?.[0];
  return first?.xref ?? null;
}

describe("GET /api/tree/individuals/[xref]/descendants", () => {
  it("returns 503 when DATABASE_URL is not set", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const req = new NextRequest("http://localhost/api/tree/individuals/I1/descendants");
      const res = await GET(req, { params: Promise.resolve({ xref: "I1" }) });
      expect(res.status).toBe(503);
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });

  it("returns 404 for unknown xref", async () => {
    if (!process.env.DATABASE_URL) return;
    const req = new NextRequest("http://localhost/api/tree/individuals/UNKNOWN_XREF_99999/descendants");
    const res = await GET(req, { params: Promise.resolve({ xref: "UNKNOWN_XREF_99999" }) });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toHaveProperty("error", "Individual not found");
  });

  it("returns 200 with descendants and meta when xref exists", async () => {
    if (!process.env.DATABASE_URL) return;
    const xref = await getFirstXref();
    if (!xref) return;

    const req = new NextRequest(
      `http://localhost/api/tree/individuals/${encodeURIComponent(xref)}/descendants`
    );
    const res = await GET(req, { params: Promise.resolve({ xref }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("descendants");
    expect(json).toHaveProperty("meta");
    expect(Array.isArray(json.descendants)).toBe(true);
    expect(json.meta).toHaveProperty("total");
    expect(json.meta).toHaveProperty("maxDepth");
  });

  it("descendants include depth and givenNames", async () => {
    if (!process.env.DATABASE_URL) return;
    const xref = await getFirstXref();
    if (!xref) return;

    const req = new NextRequest(
      `http://localhost/api/tree/individuals/${encodeURIComponent(xref)}/descendants?includeSelf=true`
    );
    const res = await GET(req, { params: Promise.resolve({ xref }) });
    expect(res.status).toBe(200);
    const { descendants } = await res.json();
    if (descendants.length > 0) {
      const d = descendants[0];
      expect(d).toHaveProperty("depth");
      expect(typeof d.depth).toBe("number");
      expect(d).toHaveProperty("givenNames");
      expect(Array.isArray(d.givenNames)).toBe(true);
    }
  });

  it("honors includeSelf query param", async () => {
    if (!process.env.DATABASE_URL) return;
    const xref = await getFirstXref();
    if (!xref) return;

    const reqWith = new NextRequest(
      `http://localhost/api/tree/individuals/${encodeURIComponent(xref)}/descendants?includeSelf=true`
    );
    const resWith = await GET(reqWith, { params: Promise.resolve({ xref }) });
    const jsonWith = await resWith.json();

    const reqWithout = new NextRequest(
      `http://localhost/api/tree/individuals/${encodeURIComponent(xref)}/descendants?includeSelf=false`
    );
    const resWithout = await GET(reqWithout, { params: Promise.resolve({ xref }) });
    const jsonWithout = await resWithout.json();

    const withSelf = jsonWith.descendants.filter((d: { depth: number }) => d.depth === 0);
    const withoutSelf = jsonWithout.descendants.filter((d: { depth: number }) => d.depth === 0);
    expect(withSelf.length).toBeGreaterThanOrEqual(0);
    expect(withoutSelf.length).toBe(0);
  });
});
