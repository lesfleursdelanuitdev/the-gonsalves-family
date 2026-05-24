import { describe, expect, it } from "vitest";
import { markdownToPlainPreview } from "@ligneous/gedcom-events";

describe("markdownToPlainPreview", () => {
  it("strips markdown for card previews", () => {
    expect(markdownToPlainPreview("**Bold** and [link](http://x)", 50)).toBe("Bold and link");
  });
});
