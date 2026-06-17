import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/messages/route";

const { requireMessageAuthMock } = vi.hoisted(() => ({
  requireMessageAuthMock: vi.fn(),
}));

vi.mock("@/lib/messages/require-message-auth", () => ({
  requireMessageAuth: requireMessageAuthMock,
}));

vi.mock("@/lib/tree", () => ({
  resolveTreeId: vi.fn().mockResolvedValue("tree-1"),
}));

vi.mock("@/lib/messages/message-queries", () => ({
  listPublicMessages: vi.fn().mockResolvedValue({ messages: [], total: 0, hasMore: false }),
  recipientAllowsDirectMessages: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/messages", () => {
  it("returns 401 when not authenticated", async () => {
    requireMessageAuthMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Authentication required", requiresAuth: true }), {
        status: 401,
      }),
    });

    const res = await GET(new Request("http://localhost/api/messages"));
    expect(res.status).toBe(401);
  });

  it("returns inbox messages for authenticated users", async () => {
    requireMessageAuthMock.mockResolvedValue({
      ok: true,
      user: { id: "u1", username: "alice", email: "a@example.com", name: "Alice", isWebsiteOwner: false },
      viewer: { kind: "authenticated", user: { id: "u1" } },
    });

    const res = await GET(new Request("http://localhost/api/messages?folder=inbox"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.messages).toEqual([]);
  });
});
