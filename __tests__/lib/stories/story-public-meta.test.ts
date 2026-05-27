import { describe, expect, it } from "vitest";
import {
  formatPublicAuthorLines,
  publicAuthorCreditRole,
  publicAuthorCredits,
} from "@/lib/stories/story-public-meta";

describe("publicAuthorCreditRole", () => {
  it("maps prefix modes to role labels", () => {
    expect(publicAuthorCreditRole({ name: "Alex", authorPrefixMode: "by" })).toBe("By");
    expect(publicAuthorCreditRole({ name: "Alex", authorPrefixMode: "author_label" })).toBe("Author:");
    expect(
      publicAuthorCreditRole({
        name: "Alex",
        authorPrefixMode: "custom",
        authorPrefixCustom: "As told by",
      }),
    ).toBe("As told by");
    expect(publicAuthorCreditRole({ name: "Alex", authorPrefixMode: "none" })).toBeNull();
  });
});

describe("publicAuthorCredits", () => {
  it("returns structured role and name credits from story meta", () => {
    expect(
      publicAuthorCredits(
        {
          authors: [
            { name: "Neville Gonsalves", authorPrefixMode: "by" },
            {
              name: "Augustinho Thomas Gonsalves",
              authorPrefixMode: "custom",
              authorPrefixCustom: "As told by",
            },
          ],
        },
        null,
      ),
    ).toEqual([
      { role: "By", name: "Neville Gonsalves" },
      { role: "As told by", name: "Augustinho Thomas Gonsalves" },
    ]);
  });

  it("falls back to db author with By prefix", () => {
    expect(publicAuthorCredits({ authors: [] }, "Monica Gonsalves")).toEqual([
      { role: "By", name: "Monica Gonsalves" },
    ]);
  });
});

describe("formatPublicAuthorLines", () => {
  it("still joins role and name for single-line displays", () => {
    expect(
      formatPublicAuthorLines(
        {
          authors: [
            { name: "Neville Gonsalves", authorPrefixMode: "by" },
            {
              name: "Augustinho Thomas Gonsalves",
              authorPrefixMode: "custom",
              authorPrefixCustom: "As told by",
            },
          ],
        },
        null,
      ),
    ).toEqual(["By Neville Gonsalves", "As told by Augustinho Thomas Gonsalves"]);
  });
});
