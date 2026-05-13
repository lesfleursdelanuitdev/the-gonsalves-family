import { describe, expect, it } from "vitest";
import {
  decodeReturnToParam,
  sanitizePublicReturnPath,
  sanitizePublicReturnPathExcludingLogin,
} from "@/lib/auth/public-return-path";

describe("sanitizePublicReturnPath", () => {
  it("accepts path and query", () => {
    expect(sanitizePublicReturnPath("/media?collection=photos")).toBe("/media?collection=photos");
  });

  it("rejects protocol-relative and absolute", () => {
    expect(sanitizePublicReturnPath("//evil.com")).toBeNull();
    expect(sanitizePublicReturnPath("https://evil.com")).toBeNull();
    expect(sanitizePublicReturnPath("relative")).toBeNull();
  });

  it("strips hash", () => {
    expect(sanitizePublicReturnPath("/tree#frag")).toBe("/tree");
  });
});

describe("sanitizePublicReturnPathExcludingLogin", () => {
  it("excludes /login", () => {
    expect(sanitizePublicReturnPathExcludingLogin("/login")).toBeNull();
    expect(sanitizePublicReturnPathExcludingLogin("/login?returnTo=%2F")).toBeNull();
  });
});

describe("decodeReturnToParam", () => {
  it("decodes percent-encoding", () => {
    expect(decodeReturnToParam("%2Fmedia%3Fcollection%3Dphotos")).toBe("/media?collection=photos");
  });
});
