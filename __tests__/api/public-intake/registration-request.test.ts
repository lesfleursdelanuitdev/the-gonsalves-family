/**
 * Tests POST /api/public-intake/registration-request.
 *
 * Strategy: real sanitizers run (we want to exercise the validation logic),
 * but rate-limiting and Prisma are mocked.
 * `resolvePublicIntakeTreeId` is kept real — it calls prisma.tree.findFirst
 * which is mocked via @/lib/database/prisma.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/public-intake/registration-request/route";

// ── mocks ─────────────────────────────────────────────────────────────────────

const { prismaMock, checkRateLimitMock } = vi.hoisted(() => ({
  prismaMock: {
    tree: { findFirst: vi.fn() },
    registrationRequest: { create: vi.fn() },
  },
  checkRateLimitMock: vi.fn(),
}));

vi.mock("@/lib/database/prisma", () => ({ prisma: prismaMock }));

// Keep real sanitizers but stub the rate limiter (in-memory Map would accumulate across tests).
vi.mock("@/lib/public-intake/intake", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/public-intake/intake")>();
  return { ...original, checkRateLimit: checkRateLimitMock };
});

// ── helpers ───────────────────────────────────────────────────────────────────

const VALID_BODY = {
  treeId: null,
  firstName: "Alice",
  lastName: "Gonsalves",
  email: "alice@example.com",
  preferredUsername: "alice_g",
  requestDetails: "I am a descendant of José Gonsalves and would like access.",
};

const TREE_ROW = { id: "tree-1", gedcomFileId: "file-uuid" };
const CREATED_REQUEST = { id: "req-1", status: "pending", createdAt: new Date() };

function req(body: Record<string, unknown>, ip = "10.0.0.1") {
  return new NextRequest("http://localhost/api/public-intake/registration-request", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  checkRateLimitMock.mockReturnValue(null); // not rate-limited
  prismaMock.tree.findFirst.mockResolvedValue(TREE_ROW);
  prismaMock.registrationRequest.create.mockResolvedValue(CREATED_REQUEST);
});

// ── rate limit ────────────────────────────────────────────────────────────────

describe("POST /api/public-intake/registration-request — rate limit", () => {
  it("returns the rate-limit response when rate limit is hit", async () => {
    const limitResponse = new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
    checkRateLimitMock.mockReturnValue(limitResponse);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(429);
  });
});

// ── honeypot ──────────────────────────────────────────────────────────────────

describe("POST /api/public-intake/registration-request — honeypot", () => {
  it("returns 202 (accepted silently) when honeypot field is filled", async () => {
    const res = await POST(req({ ...VALID_BODY, website: "spam.com" }));
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // must NOT have created a DB record
    expect(prismaMock.registrationRequest.create).not.toHaveBeenCalled();
  });

  it("also traps 'company' honeypot field", async () => {
    const res = await POST(req({ ...VALID_BODY, company: "SpamCo" }));
    expect(res.status).toBe(202);
  });
});

// ── body validation ───────────────────────────────────────────────────────────

describe("POST /api/public-intake/registration-request — body validation", () => {
  it("returns 400 when body is not valid JSON", async () => {
    const badReq = new NextRequest("http://localhost/api/public-intake/registration-request", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(badReq);
    expect(res.status).toBe(400);
  });

  it("returns 400 with field errors when required fields are missing", async () => {
    const res = await POST(req({ treeId: null }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toHaveProperty("firstName");
    expect(body.errors).toHaveProperty("lastName");
    expect(body.errors).toHaveProperty("email");
    expect(body.errors).toHaveProperty("preferredUsername");
    expect(body.errors).toHaveProperty("requestDetails");
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(req({ ...VALID_BODY, email: "not-an-email" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toHaveProperty("email");
  });

  it("returns 400 when username contains illegal characters", async () => {
    const res = await POST(req({ ...VALID_BODY, preferredUsername: "bad username!" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toHaveProperty("preferredUsername");
  });

  it("returns 400 when username is too short (under 3 chars)", async () => {
    const res = await POST(req({ ...VALID_BODY, preferredUsername: "ab" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toHaveProperty("preferredUsername");
  });

  it("returns 400 when requestDetails is too short (under 10 chars)", async () => {
    const res = await POST(req({ ...VALID_BODY, requestDetails: "short" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toHaveProperty("requestDetails");
  });
});

// ── tree resolution ───────────────────────────────────────────────────────────

describe("POST /api/public-intake/registration-request — tree resolution", () => {
  it("returns 400 when tree is not found", async () => {
    prismaMock.tree.findFirst.mockResolvedValue(null);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toBeDefined();
  });
});

// ── success ───────────────────────────────────────────────────────────────────

describe("POST /api/public-intake/registration-request — success", () => {
  it("returns 201 with created request on valid submission", async () => {
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.request.id).toBe("req-1");
    expect(body.request.status).toBe("pending");
  });

  it("calls registrationRequest.create with the correct tree and field values", async () => {
    await POST(req(VALID_BODY));
    expect(prismaMock.registrationRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          treeId: "tree-1",
          firstName: "Alice",
          lastName: "Gonsalves",
          email: "alice@example.com",
          preferredUsername: "alice_g",
        }),
      })
    );
  });
});

// ── DB error ──────────────────────────────────────────────────────────────────

describe("POST /api/public-intake/registration-request — DB error", () => {
  it("returns 500 when the DB create throws", async () => {
    prismaMock.registrationRequest.create.mockRejectedValue(new Error("DB unavailable"));
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Could not save");
  });
});
