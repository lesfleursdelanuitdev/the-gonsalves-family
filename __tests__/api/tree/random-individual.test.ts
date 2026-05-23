import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/tree/random/individual/route";

// ── mocks ─────────────────────────────────────────────────────────────────────

const { prismaMock, resolveTreeFileUuidMock, mapIndividualRowMock } = vi.hoisted(() => ({
  prismaMock: {
    gedcomIndividual: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
  resolveTreeFileUuidMock: vi.fn(),
  mapIndividualRowMock: vi.fn(),
}));

vi.mock("@/lib/database/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/tree", () => ({ resolveTreeFileUuid: resolveTreeFileUuidMock }));
vi.mock("@/lib/individual-mapper", () => ({ mapIndividualRow: mapIndividualRowMock }));

// ── helpers ───────────────────────────────────────────────────────────────────

const FILE_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const MAPPED_INDIVIDUAL = { uuid: "i1", xref: "@I1@", firstName: "Alice", lastName: "Gonsalves" };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = "postgresql://test";
  resolveTreeFileUuidMock.mockResolvedValue(FILE_UUID);
  prismaMock.gedcomIndividual.count.mockResolvedValue(100);
  prismaMock.gedcomIndividual.findMany.mockResolvedValue([{ id: "i1", xref: "@I1@", fullName: "Alice /Gonsalves/" }]);
  mapIndividualRowMock.mockReturnValue(MAPPED_INDIVIDUAL);
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/tree/random/individual", () => {
  it("returns 503 when DATABASE_URL is not set", async () => {
    delete process.env.DATABASE_URL;
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("Database not configured");
  });

  it("returns 404 when tree is not found", async () => {
    resolveTreeFileUuidMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Tree not found");
  });

  it("returns {individual: null} when tree has no individuals", async () => {
    prismaMock.gedcomIndividual.count.mockResolvedValue(0);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.individual).toBeNull();
  });

  it("returns 200 with a mapped individual when tree has individuals", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.individual).toEqual(MAPPED_INDIVIDUAL);
    expect(mapIndividualRowMock).toHaveBeenCalledOnce();
  });

  it("scopes count and findMany queries to the file UUID", async () => {
    await GET();
    expect(prismaMock.gedcomIndividual.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ fileUuid: FILE_UUID }) })
    );
    expect(prismaMock.gedcomIndividual.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ fileUuid: FILE_UUID }) })
    );
  });

  it("uses a random skip offset between 0 and count-1", async () => {
    prismaMock.gedcomIndividual.count.mockResolvedValue(50);
    await GET();
    const call = prismaMock.gedcomIndividual.findMany.mock.calls[0]?.[0];
    expect(call.skip).toBeGreaterThanOrEqual(0);
    expect(call.skip).toBeLessThan(50);
  });

  it("returns {individual: null} when findMany returns empty (race condition)", async () => {
    prismaMock.gedcomIndividual.findMany.mockResolvedValue([]);
    const res = await GET();
    const body = await res.json();
    expect(body.individual).toBeNull();
  });

  it("returns 500 when an unexpected error is thrown", async () => {
    prismaMock.gedcomIndividual.count.mockRejectedValue(new Error("unexpected DB error"));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("unexpected DB error");
  });
});
