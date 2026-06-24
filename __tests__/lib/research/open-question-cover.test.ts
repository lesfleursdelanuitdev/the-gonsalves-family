import { describe, expect, it } from "vitest";
import {
  isPublicSafeOpenQuestionCoverMedia,
  pickOpenQuestionCoverSrc,
  type OpenQuestionCoverMedia,
} from "@/lib/research/open-question-cover";

function media(overrides: Partial<OpenQuestionCoverMedia> = {}): OpenQuestionCoverMedia {
  return {
    id: "media-1",
    fileRef: "/uploads/gedcom-admin/images/sample.jpg",
    form: "jpg",
    individualMedia: [],
    individualProfileFor: [],
    familyMedia: [],
    familyProfileFor: [],
    ...overrides,
  };
}

describe("open-question-cover", () => {
  it("rejects media linked to living people", () => {
    const row = media({
      individualMedia: [{ individual: { id: "p1", isLiving: true } }],
    });
    expect(isPublicSafeOpenQuestionCoverMedia(row)).toBe(false);
    expect(pickOpenQuestionCoverSrc("q1", [row])).toBeNull();
  });

  it("accepts deceased-linked raster media and picks a stable cover", () => {
    const a = media({ id: "a", fileRef: "/uploads/a.jpg" });
    const b = media({ id: "b", fileRef: "/uploads/b.jpg" });
    const first = pickOpenQuestionCoverSrc("question-123", [a, b]);
    const second = pickOpenQuestionCoverSrc("question-123", [a, b]);
    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });

  it("ignores non-raster media forms", () => {
    const row = media({ form: "pdf", fileRef: "/uploads/doc.pdf" });
    expect(isPublicSafeOpenQuestionCoverMedia(row)).toBe(false);
  });
});
