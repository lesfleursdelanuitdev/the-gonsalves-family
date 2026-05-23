/**
 * Tests POST /api/public-intake/contact-message.
 *
 * Strategy: real sanitizers run, rate-limiting and Prisma are mocked.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/public-intake/contact-message/route";

// ── mocks ─────────────────────────────────────────────────────────────────────

const { prismaMock, checkRateLimitMock } = vi.hoisted(() => ({
  prismaMock: {
    tree: { findFirst: vi.fn() },
    contactMessage: { create: vi.fn() },
  },
  checkRateLimitMock: vi.fn(),
}));

vi.mock("@/lib/database/prisma", () => ({ prisma: prismaMock }));

vi.mock("@/lib/public-intake/intake", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/public-intake/intake")>();
  return { ...original, checkRateLimit: checkRateLimitMock };
});

// ── helpers ───────────────────────────────────────────────────────────────────

const VALID_BODY = {
  treeId: null,
  email: "bob@example.com",
  message: "I would like to get in touch about the Gonsalves family records.",
};

const TREE_ROW = { id: "tree-1", gedcomFileId: "file-uuid" };
const CREATED_MESSAGE = { id: "msg-1", status: "pending", createdAt: new Date() };

function req(body: Record<string, unknown>, ip = "10.0.0.1") {
  return new NextRequest("http://localhost/api/public-intake/contact-message", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  checkRateLimitMock.mockReturnValue(null);
  prismaMock.tree.findFirst.mockResolvedValue(TREE_ROW);
  prismaMock.contactMessage.create.mockResolvedValue(CREATED_MESSAGE);
});

// ── rate limit ────────────────────────────────────────────────────────────────

describe("POST /api/public-intake/contact-message — rate limit", () => {
  it("returns the rate-limit response when rate limit is hit", async () => {
    const limitResponse = new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
    checkRateLimitMock.mockReturnValue(limitResponse);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(429);
  });
});

// ── honeypot ──────────────────────────────────────────────────────────────────

describe("POST /api/public-intake/contact-message — honeypot", () => {
  it("returns 202 (accepted silently) when honeypot field is filled", async () => {
    const res = await POST(req({ ...VALID_BODY, website: "spam.com" }));
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(prismaMock.contactMessage.create).not.toHaveBeenCalled();
  });

  it("also traps 'company' honeypot field", async () => {
    const res = await POST(req({ ...VALID_BODY, company: "SpamCo" }));
    expect(res.status).toBe(202);
  });
});

// ── body validation ───────────────────────────────────────────────────────────

describe("POST /api/public-intake/contact-message — body validation", () => {
  it("returns 400 when body is not valid JSON", async () => {
    const badReq = new NextRequest("http://localhost/api/public-intake/contact-message", {
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
    expect(body.errors).toHaveProperty("email");
    expect(body.errors).toHaveProperty("message");
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(req({ ...VALID_BODY, email: "not-an-email" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toHaveProperty("email");
  });

  it("returns 400 when message is too short (under 10 chars)", async () => {
    const res = await POST(req({ ...VALID_BODY, message: "short" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toHaveProperty("message");
  });

  it("accepts and truncates messages over 6000 chars (sanitizeText slices, does not reject)", async () => {
    const res = await POST(req({ ...VALID_BODY, message: "a".repeat(6001) }));
    expect(res.status).toBe(201);
  });
});

// ── tree resolution ───────────────────────────────────────────────────────────

describe("POST /api/public-intake/contact-message — tree resolution", () => {
  it("returns 400 when tree is not found", async () => {
    prismaMock.tree.findFirst.mockResolvedValue(null);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toBeDefined();
  });
});

// ── success ───────────────────────────────────────────────────────────────────

describe("POST /api/public-intake/contact-message — success", () => {
  it("returns 201 with created message on valid submission", async () => {
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message.id).toBe("msg-1");
    expect(body.message.status).toBe("pending");
  });

  it("calls contactMessage.create with the correct tree and field values", async () => {
    await POST(req(VALID_BODY));
    expect(prismaMock.contactMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          treeId: "tree-1",
          email: "bob@example.com",
          message: VALID_BODY.message,
        }),
      })
    );
  });

  it("accepts optional firstName, lastName, and subject fields", async () => {
    const body = {
      ...VALID_BODY,
      firstName: "Bob",
      lastName: "Smith",
      subject: "Family records inquiry",
    };
    const res = await POST(req(body));
    expect(res.status).toBe(201);
    expect(prismaMock.contactMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: "Bob",
          lastName: "Smith",
          subject: "Family records inquiry",
        }),
      })
    );
  });

  it("omits optional fields when not provided", async () => {
    await POST(req(VALID_BODY));
    const call = prismaMock.contactMessage.create.mock.calls[0]?.[0];
    expect(call.data.firstName).toBeNull();
    expect(call.data.lastName).toBeNull();
    expect(call.data.subject).toBeNull();
  });
});

// ── DB error ──────────────────────────────────────────────────────────────────

describe("POST /api/public-intake/contact-message — DB error", () => {
  it("returns 500 when the DB create throws", async () => {
    prismaMock.contactMessage.create.mockRejectedValue(new Error("DB unavailable"));
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Could not save");
  });
});
