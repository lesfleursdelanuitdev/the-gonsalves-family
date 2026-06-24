import { describe, expect, it } from "vitest";
import { applyAlbumViewModelLivingPrivacy } from "@/lib/album/apply-public-album-living-privacy";
import type { AlbumViewModel } from "@ligneous/album-view";
import type { PublicViewer } from "@/lib/auth/public-viewer";

const anonymous: PublicViewer = { kind: "anonymous" };

function baseModel(): AlbumViewModel {
  return {
    kind: "generated",
    source: { type: "individual", individualId: "ind-1" },
    title: "Album",
    coverMedia: null,
    media: [
      {
        id: "m1",
        title: "Wedding",
        fileRef: "/uploads/gedcom-admin/images/wedding.jpg",
        form: "jpeg",
        linkedIndividuals: [
          { id: "d1", xref: "@I1@", gedcomName: "Norman", displayName: "Norman", isLiving: false },
          { id: "l1", xref: "@I2@", gedcomName: "James", displayName: "James", isLiving: true },
        ],
      },
    ],
    totalCount: 1,
    visibility: "public",
    canEditAlbumMetadata: false,
    canEditMembership: false,
    gridMode: "static",
    presentation: "album",
  };
}

describe("applyAlbumViewModelLivingPrivacy", () => {
  it("gates mixed living/deceased media items for anonymous viewers", () => {
    const model = applyAlbumViewModelLivingPrivacy(baseModel(), anonymous, new Map());
    expect(model.media[0]?.privacyRestricted).toBe(true);
    expect(model.media[0]?.fileRef).toBe("/images/personCardBg.png");
    expect(model.media[0]?.linkedIndividuals?.map((p) => p.displayName)).toEqual([
      "Norman",
      "+ 1 living person",
    ]);
  });
});
