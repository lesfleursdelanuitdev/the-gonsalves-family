import { describe, expect, it } from "vitest";
import {
  buildLoginWallPath,
  canViewFullIndividual,
  type PublicViewer,
} from "@/lib/auth/public-viewer-context";

describe("canViewFullIndividual", () => {
  const anonymous: PublicViewer = { kind: "anonymous" };
  const authenticated: PublicViewer = {
    kind: "authenticated",
    user: {
      id: "u1",
      username: "alice",
      email: "alice@example.com",
      name: "Alice",
      isWebsiteOwner: false,
    },
  };

  it("allows deceased individuals for anonymous viewers", () => {
    expect(canViewFullIndividual(anonymous, false)).toBe(true);
  });

  it("blocks living individuals for anonymous viewers", () => {
    expect(canViewFullIndividual(anonymous, true)).toBe(false);
  });

  it("allows living individuals for authenticated viewers", () => {
    expect(canViewFullIndividual(authenticated, true)).toBe(true);
  });
});

describe("buildLoginWallPath", () => {
  it("builds a safe login redirect", () => {
    expect(buildLoginWallPath("/individuals/abc")).toBe("/login?returnTo=%2Findividuals%2Fabc");
  });

  it("rejects unsafe return paths", () => {
    expect(buildLoginWallPath("//evil.com")).toBe("/login?returnTo=%2F");
  });
});
