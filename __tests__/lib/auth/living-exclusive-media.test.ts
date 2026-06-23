import { describe, expect, it } from "vitest";
import {
  canViewLivingFamilyGeneratedAlbum,
  collectFamilyPartners,
  collectLinkedPeople,
  hasAnyLivingFamilyPartners,
  hasAnyLivingLinkedPeople,
  isMediaLinkedToAnyLivingPeople,
  shouldGateLivingLinkedEntity,
} from "@/lib/auth/living-exclusive-media";
import type { PublicViewer } from "@/lib/auth/public-viewer";

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

const emptyInput = {
  individualMedia: [],
  individualProfileFor: [],
  familyMedia: [],
  familyProfileFor: [],
};

describe("collectLinkedPeople", () => {
  it("merges individuals and family partners", () => {
    const people = collectLinkedPeople({
      individualMedia: [{ individual: { id: "p1", isLiving: true } }],
      individualProfileFor: [],
      familyMedia: [
        {
          family: {
            husband: { id: "p2", isLiving: true },
            wife: { id: "p3", isLiving: false },
          },
        },
      ],
      familyProfileFor: [],
    });
    expect(people.get("p1")).toBe(true);
    expect(people.get("p2")).toBe(true);
    expect(people.get("p3")).toBe(false);
  });
});

describe("hasAnyLivingLinkedPeople", () => {
  it("returns false when no people are linked", () => {
    expect(hasAnyLivingLinkedPeople(new Map())).toBe(false);
  });

  it("returns false when only deceased people are linked", () => {
    expect(
      hasAnyLivingLinkedPeople(
        new Map([
          ["p1", false],
          ["p2", false],
        ]),
      ),
    ).toBe(false);
  });

  it("returns true when any linked person is living", () => {
    expect(
      hasAnyLivingLinkedPeople(
        new Map([
          ["p1", true],
          ["p2", false],
        ]),
      ),
    ).toBe(true);
  });
});

describe("isMediaLinkedToAnyLivingPeople", () => {
  it("returns true when all linked people are living", () => {
    expect(
      isMediaLinkedToAnyLivingPeople({
        individualMedia: [
          { individual: { id: "p1", isLiving: true } },
          { individual: { id: "p2", isLiving: true } },
        ],
        individualProfileFor: [],
        familyMedia: [],
        familyProfileFor: [],
      }),
    ).toBe(true);
  });

  it("returns true for mixed living and deceased links", () => {
    expect(
      isMediaLinkedToAnyLivingPeople({
        individualMedia: [{ individual: { id: "p1", isLiving: true } }],
        individualProfileFor: [],
        familyMedia: [
          {
            family: {
              husband: null,
              wife: { id: "p2", isLiving: false },
            },
          },
        ],
        familyProfileFor: [],
      }),
    ).toBe(true);
  });

  it("returns false when only deceased people are linked", () => {
    expect(
      isMediaLinkedToAnyLivingPeople({
        individualMedia: [{ individual: { id: "p1", isLiving: false } }],
        individualProfileFor: [],
        familyMedia: [
          {
            family: {
              husband: null,
              wife: { id: "p2", isLiving: false },
            },
          },
        ],
        familyProfileFor: [],
      }),
    ).toBe(false);
  });

  it("returns false when no people are linked", () => {
    expect(isMediaLinkedToAnyLivingPeople(emptyInput)).toBe(false);
  });
});

describe("hasAnyLivingFamilyPartners", () => {
  it("returns true when any partner is living", () => {
    expect(
      hasAnyLivingFamilyPartners({
        husband: { id: "h1", isLiving: true },
        wife: { id: "w1", isLiving: false },
      }),
    ).toBe(true);
  });

  it("returns false when every partner is deceased", () => {
    expect(
      hasAnyLivingFamilyPartners({
        husband: { id: "h1", isLiving: false },
        wife: { id: "w1", isLiving: false },
      }),
    ).toBe(false);
  });
});

describe("canViewLivingFamilyGeneratedAlbum", () => {
  const allLivingFamily = {
    husband: { id: "h1", isLiving: true },
    wife: { id: "w1", isLiving: true },
  };

  it("blocks anonymous viewers when any partner is living", () => {
    expect(canViewLivingFamilyGeneratedAlbum(anonymous, allLivingFamily)).toBe(false);
    expect(
      canViewLivingFamilyGeneratedAlbum(anonymous, {
        husband: { id: "h1", isLiving: true },
        wife: { id: "w1", isLiving: false },
      }),
    ).toBe(false);
  });

  it("allows authenticated viewers when any partner is living", () => {
    expect(canViewLivingFamilyGeneratedAlbum(authenticated, allLivingFamily)).toBe(true);
  });

  it("allows anonymous viewers when every partner is deceased", () => {
    expect(
      canViewLivingFamilyGeneratedAlbum(anonymous, {
        husband: { id: "h1", isLiving: false },
        wife: { id: "w1", isLiving: false },
      }),
    ).toBe(true);
  });
});

describe("collectFamilyPartners", () => {
  it("collects husband and wife", () => {
    const people = collectFamilyPartners({
      husband: { id: "h1", isLiving: true },
      wife: { id: "w1", isLiving: false },
    });
    expect(people.get("h1")).toBe(true);
    expect(people.get("w1")).toBe(false);
  });
});

describe("shouldGateLivingLinkedEntity", () => {
  it("gates anonymous viewers when any living person is linked", () => {
    expect(shouldGateLivingLinkedEntity(anonymous, true)).toBe(true);
  });

  it("allows authenticated viewers", () => {
    expect(shouldGateLivingLinkedEntity(authenticated, true)).toBe(false);
  });

  it("allows public entities with deceased-only links", () => {
    expect(shouldGateLivingLinkedEntity(anonymous, false)).toBe(false);
  });
});
