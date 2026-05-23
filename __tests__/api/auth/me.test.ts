import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/auth/me/route";

// ── mocks ─────────────────────────────────────────────────────────────────────

const { cookiesJarMock, getCurrentUserMock, authCookieNameMock } = vi.hoisted(() => ({
  cookiesJarMock: { get: vi.fn() },
  getCurrentUserMock: vi.fn(),
  authCookieNameMock: vi.fn().mockReturnValue("session"),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(cookiesJarMock),
}));

vi.mock("@ligneous/auth", async (importOriginal) => {
  const original = await importOriginal<typeof import("@ligneous/auth")>();
  return {
    ...original,
    authCookieName: authCookieNameMock,
    getCurrentUserFromToken: getCurrentUserMock,
  };
});

// prisma is passed through but getCurrentUserFromToken is mocked so no DB calls happen
vi.mock("@/lib/database/prisma", () => ({ prisma: {} }));

// ── helpers ───────────────────────────────────────────────────────────────────

const SIGNED_IN_USER = { id: "u1", username: "alice", isWebsiteOwner: false };

beforeEach(() => {
  vi.clearAllMocks();
  authCookieNameMock.mockReturnValue("session");
  cookiesJarMock.get.mockReturnValue(undefined);
  getCurrentUserMock.mockResolvedValue(null);
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/auth/me (public family site)", () => {
  it("returns 200 with user when signed in", async () => {
    cookiesJarMock.get.mockReturnValue({ value: "tok-abc" });
    getCurrentUserMock.mockResolvedValue(SIGNED_IN_USER);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual(SIGNED_IN_USER);
  });

  it("returns 200 with {user: null} when no session cookie", async () => {
    cookiesJarMock.get.mockReturnValue(undefined);
    getCurrentUserMock.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it("returns 200 with {user: null} when session token is invalid", async () => {
    cookiesJarMock.get.mockReturnValue({ value: "stale-token" });
    getCurrentUserMock.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it("passes the token from the cookie to getCurrentUserFromToken", async () => {
    cookiesJarMock.get.mockReturnValue({ value: "my-token" });
    getCurrentUserMock.mockResolvedValue(SIGNED_IN_USER);

    await GET();
    expect(getCurrentUserMock).toHaveBeenCalledWith(
      expect.anything(), // prisma
      "my-token",
      expect.objectContaining({ touchSession: false }),
    );
  });

  it("passes null token when cookie is absent", async () => {
    await GET();
    expect(getCurrentUserMock).toHaveBeenCalledWith(
      expect.anything(),
      null,
      expect.objectContaining({ touchSession: false }),
    );
  });

  it("returns 500 when getCurrentUserFromToken throws", async () => {
    getCurrentUserMock.mockRejectedValue(new Error("session DB error"));

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });

  it("returns 500 when cookies() throws", async () => {
    const { cookies } = await import("next/headers");
    (cookies as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("headers not available"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
