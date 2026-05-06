import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/tree/pedigree/route";

function req(url: string) {
  return new NextRequest(url);
}

describe("GET /api/tree/pedigree", () => {
  it("returns 503 when DATABASE_URL is not set", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const res = await GET(req("http://localhost/api/tree/pedigree?root=@I1@"));
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json).toHaveProperty("error", "Database not configured");
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });

  it("returns 400 when root query is missing", async () => {
    if (!process.env.DATABASE_URL) return;
    const res = await GET(req("http://localhost/api/tree/pedigree"));
    expect(res.status).toBe(400);
  });
});
