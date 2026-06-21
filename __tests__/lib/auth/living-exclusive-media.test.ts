import { describe, expect, it } from "vitest";
import {
  areAllLinkedPeopleLiving,
  canViewLivingFamilyGeneratedAlbum,
  collectFamilyPartners,
  collectLinkedPeople,
  isFamilyAllLivingPartners,
  isMediaLinkedOnlyToLivingPeople,
  shouldGateAllLivingLinkedEntity,
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

describe("isMediaLinkedOnlyToLivingPeople", () => {
  it("returns true when all linked people are living", () => {
    expect(
      isMediaLinkedOnlyToLivingPeople({
        individualMedia: [
          { individual: { id: "p1", isLiving: true } },
          { individual: { id: "p2", isLiving: true } },
        ],
        individualProfileFor: [],
        familyMedia: [
          {
            family: {
              husband: { id: "p2", isLiving: true },
              wife: null,
            },
          },
        ],
        familyProfileFor: [],
      }),
    ).toBe(true);
  });

  it("returns true even when tags or places exist on the entity", () => {
    expect(
      isMediaLinkedOnlyToLivingPeople({
        individualMedia: [{ individual: { id: "p1", isLiving: true } }],
        individualProfileFor: [],
        familyMedia: [
          {
            family: {
              husband: { id: "p2", isLiving: true },
              wife: null,
            },
          },
        ],
        familyProfileFor: [],
      }),
    ).toBe(true);
  });

  it("returns false when any linked person is deceased", () => {
    expect(
      isMediaLinkedOnlyToLivingPeople({
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
    ).toBe(false);
  });

  it("returns false when no people are linked", () => {
    expect(isMediaLinkedOnlyToLivingPeople(emptyInput)).toBe(false);
  });
});

describe("areAllLinkedPeopleLiving", () => {
  it("requires at least one linked person", () => {
    expect(areAllLinkedPeopleLiving(new Map())).toBe(false);
  });
});

describe("isFamilyAllLivingPartners", () => {
  it("returns true when every partner is living", () => {
    expect(
      isFamilyAllLivingPartners({
        husband: { id: "h1", isLiving: true },
        wife: { id: "w1", isLiving: true },
      }),
    ).toBe(true);
  });

  it("returns true for a single living partner", () => {
    expect(
      isFamilyAllLivingPartners({
        husband: { id: "h1", isLiving: true },
        wife: null,
      }),
    ).toBe(true);
  });

  it("returns false when any partner is deceased", () => {
    expect(
      isFamilyAllLivingPartners({
        husband: { id: "h1", isLiving: true },
        wife: { id: "w1", isLiving: false },
      }),
    ).toBe(false);
  });

  it("returns false when no partners are linked", () => {
    expect(
      isFamilyAllLivingPartners({
        husband: null,
        wife: null,
      }),
    ).toBe(false);
  });
});

describe("canViewLivingFamilyGeneratedAlbum", () => {
  const allLivingFamily = {
    husband: { id: "h1", isLiving: true },
    wife: { id: "w1", isLiving: true },
  };

  it("blocks anonymous viewers for all-living families", () => {
    expect(canViewLivingFamilyGeneratedAlbum(anonymous, allLivingFamily)).toBe(false);
  });

  it("allows authenticated viewers for all-living families", () => {
    expect(canViewLivingFamilyGeneratedAlbum(authenticated, allLivingFamily)).toBe(true);
  });

  it("allows anonymous viewers when a partner is deceased", () => {
    expect(
      canViewLivingFamilyGeneratedAlbum(anonymous, {
        husband: { id: "h1", isLiving: true },
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

describe("shouldGateAllLivingLinkedEntity", () => {
  it("gates anonymous viewers when all linked people are living", () => {
    expect(shouldGateAllLivingLinkedEntity(anonymous, true)).toBe(true);
  });

  it("allows authenticated viewers", () => {
    expect(shouldGateAllLivingLinkedEntity(authenticated, true)).toBe(false);
  });

  it("allows public entities with deceased links", () => {
    expect(shouldGateAllLivingLinkedEntity(anonymous, false)).toBe(false);
  });
});
