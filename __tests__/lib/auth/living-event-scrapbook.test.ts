import { describe, expect, it } from "vitest";
import {
  collectEventLinkedPeople,
  collectLinkedPeople,
  generatedAlbumPlaceholderCover,
  hasAnyLivingEventParticipants,
  hasAnyLivingLinkedPeople,
  isMediaIdsLinkedToAnyLivingPeople,
} from "@/lib/auth/living-exclusive-media";
import { LIVING_MEDIA_PLACEHOLDER_COVER } from "@/lib/auth/living-media-constants";
import type { PublicViewer } from "@/lib/auth/public-viewer";

const anonymous: PublicViewer = { kind: "anonymous" };
const authenticated: PublicViewer = {
  kind: "authenticated",
  user: { id: "u1" } as never,
};

describe("event generated scrapbook living helpers", () => {
  it("detects living event participants from individuals and family partners", () => {
    const event = {
      individualEvents: [{ individual: { id: "olivia", isLiving: true } }],
      familyEvents: [
        {
          family: {
            husband: { id: "dad", isLiving: false },
            wife: { id: "mom", isLiving: true },
          },
        },
      ],
    };

    expect(hasAnyLivingEventParticipants(event)).toBe(true);
    expect(collectEventLinkedPeople(event).size).toBe(3);
  });

  it("returns false when all event participants are deceased", () => {
    const event = {
      individualEvents: [{ individual: { id: "norman", isLiving: false } }],
      familyEvents: [],
    };

    expect(hasAnyLivingEventParticipants(event)).toBe(false);
  });

  it("swaps list covers to the placeholder for anonymous viewers when gated", () => {
    expect(
      generatedAlbumPlaceholderCover(anonymous, true, "/uploads/gedcom-admin/images/grad.jpg"),
    ).toBe(LIVING_MEDIA_PLACEHOLDER_COVER);
    expect(
      generatedAlbumPlaceholderCover(authenticated, true, "/uploads/gedcom-admin/images/grad.jpg"),
    ).toBe("/uploads/gedcom-admin/images/grad.jpg");
  });
});

describe("isMediaIdsLinkedToAnyLivingPeople (media union scrapbooks)", () => {
  it("returns false for an empty media id list", async () => {
    await expect(
      isMediaIdsLinkedToAnyLivingPeople({ findMany: async () => [] } as never, "tree", []),
    ).resolves.toBe(false);
  });

  it("aggregates linked people across multiple media rows", () => {
    const combined = new Map<string, boolean>();
    for (const row of [
      {
        individualMedia: [{ individual: { id: "d1", isLiving: false } }],
        individualProfileFor: [],
        familyMedia: [],
        familyProfileFor: [],
      },
      {
        individualMedia: [{ individual: { id: "l1", isLiving: true } }],
        individualProfileFor: [],
        familyMedia: [],
        familyProfileFor: [],
      },
    ]) {
      for (const [id, isLiving] of collectLinkedPeople(row)) {
        combined.set(id, isLiving);
      }
    }
    expect(hasAnyLivingLinkedPeople(combined)).toBe(true);
  });
});
