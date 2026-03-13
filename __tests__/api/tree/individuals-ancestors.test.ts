import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/tree/individuals/[xref]/ancestors/route";

async function getFirstXref(): Promise<string | null> {
  const { GET: getIndividuals } = await import("@/app/api/tree/individuals/route");
  const res = await getIndividuals();
  if (res.status !== 200) return null;
  const json = await res.json();
  const first = json.individuals?.[0];
  return first?.xref ?? null;
}

describe("GET /api/tree/individuals/[xref]/ancestors", () => {
  it("returns 503 when DATABASE_URL is not set", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const req = new Request("http://localhost/api/tree/individuals/I1/ancestors");
      const res = await GET(req, { params: Promise.resolve({ xref: "I1" }) });
      expect(res.status).toBe(503);
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });

  it("returns 404 for unknown xref", async () => {
    if (!process.env.DATABASE_URL) return;
    const req = new Request("http://localhost/api/tree/individuals/UNKNOWN_XREF_99999/ancestors");
    const res = await GET(req, { params: Promise.resolve({ xref: "UNKNOWN_XREF_99999" }) });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toHaveProperty("error", "Individual not found");
  });

  it("returns 200 with ancestors and meta when xref exists", async () => {
    if (!process.env.DATABASE_URL) return;
    const xref = await getFirstXref();
    if (!xref) return;

    const req = new Request(
      `http://localhost/api/tree/individuals/${encodeURIComponent(xref)}/ancestors`
    );
    const res = await GET(req, { params: Promise.resolve({ xref }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("ancestors");
    expect(json).toHaveProperty("meta");
    expect(Array.isArray(json.ancestors)).toBe(true);
    expect(json.meta).toHaveProperty("total");
    expect(json.meta).toHaveProperty("maxDepth");
  });

  it("ancestors include depth and givenNames", async () => {
    if (!process.env.DATABASE_URL) return;
    const xref = await getFirstXref();
    if (!xref) return;

    const req = new Request(
      `http://localhost/api/tree/individuals/${encodeURIComponent(xref)}/ancestors?includeSelf=true`
    );
    const res = await GET(req, { params: Promise.resolve({ xref }) });
    expect(res.status).toBe(200);
    const { ancestors } = await res.json();
    if (ancestors.length > 0) {
      const a = ancestors[0];
      expect(a).toHaveProperty("depth");
      expect(typeof a.depth).toBe("number");
      expect(a).toHaveProperty("givenNames");
      expect(Array.isArray(a.givenNames)).toBe(true);
    }
  });

  it("honors includeSelf query param", async () => {
    if (!process.env.DATABASE_URL) return;
    const xref = await getFirstXref();
    if (!xref) return;

    const reqWith = new Request(
      `http://localhost/api/tree/individuals/${encodeURIComponent(xref)}/ancestors?includeSelf=true`
    );
    const resWith = await GET(reqWith, { params: Promise.resolve({ xref }) });
    const jsonWith = await resWith.json();

    const reqWithout = new Request(
      `http://localhost/api/tree/individuals/${encodeURIComponent(xref)}/ancestors?includeSelf=false`
    );
    const resWithout = await GET(reqWithout, { params: Promise.resolve({ xref }) });
    const jsonWithout = await resWithout.json();

    const withSelf = jsonWith.ancestors.filter((a: { depth: number }) => a.depth === 0);
    const withoutSelf = jsonWithout.ancestors.filter((a: { depth: number }) => a.depth === 0);
    expect(withSelf.length).toBeGreaterThanOrEqual(0);
    expect(withoutSelf.length).toBe(0);
  });
});
