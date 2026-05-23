import { describe, expect, it } from "vitest";
import { buildViewerPages, buildViewerToc } from "@/lib/stories/story-viewer-utils";
import type { StoryPublicPayload } from "@/lib/stories/story-queries";

// ── test-data helpers ─────────────────────────────────────────────────────────

function makeSection(id: string, title: string, opts?: {
  sortOrder?: number;
  isChapter?: boolean;
  subtitle?: string | null;
  contentJson?: unknown;
}) {
  return {
    id,
    title,
    sortOrder: opts?.sortOrder ?? 0,
    isChapter: opts?.isChapter ?? false,
    subtitle: opts?.subtitle ?? null,
    contentJson: opts?.contentJson ?? null,
  };
}

function makeChapter(id: string, sortOrder: number, sections: ReturnType<typeof makeSection>[]) {
  return { id, sortOrder, sections };
}

function makeStory(
  title: string,
  chapters: ReturnType<typeof makeChapter>[]
): StoryPublicPayload {
  return {
    id: "story-1",
    title,
    chapters,
    // fields below are required by the type but not used by buildViewerPages
    author: null,
    storyIndividuals: [],
    storyFamilies: [],
    storyEvents: [],
    storyPlaces: [],
    albumStories: [],
  } as unknown as StoryPublicPayload;
}

// ── buildViewerPages ──────────────────────────────────────────────────────────

describe("buildViewerPages", () => {
  it("always starts with a cover page at index 0", () => {
    const story = makeStory("My Story", []);
    const pages = buildViewerPages(story);
    expect(pages[0]).toMatchObject({ pageKind: "cover", id: "cover", title: "My Story" });
  });

  it("produces no extra pages beyond cover for a story with no chapters", () => {
    const story = makeStory("My Story", []);
    expect(buildViewerPages(story)).toHaveLength(1);
  });

  it("produces a chapter-opener for the first section and body pages for subsequent sections", () => {
    const story = makeStory("Story", [
      makeChapter("c1", 0, [
        makeSection("s1", "Chapter One", { isChapter: true }),
        makeSection("s2", "Part Two", { isChapter: false }),
      ]),
    ]);
    const pages = buildViewerPages(story);
    expect(pages).toHaveLength(3); // cover + opener + body
    expect(pages[1]).toMatchObject({ pageKind: "chapter-opener", id: "s1", chapterId: "c1" });
    expect(pages[2]).toMatchObject({ pageKind: "body", id: "s2", chapterId: "c1" });
  });

  it("assigns ascending folio numbers starting from 1 for non-cover pages", () => {
    const story = makeStory("Story", [
      makeChapter("c1", 0, [
        makeSection("s1", "Ch1", { isChapter: true }),
        makeSection("s2", "Body", { isChapter: false }),
      ]),
    ]);
    const pages = buildViewerPages(story);
    // cover is index 0; opener folio = 1; body folio = 2
    expect(pages[1]).toMatchObject({ folio: 1 });
    expect(pages[2]).toMatchObject({ folio: 2 });
  });

  it("labels chapters using ordinal words (One, Two, …)", () => {
    const story = makeStory("Story", [
      makeChapter("c1", 0, [makeSection("s1", "First", { isChapter: true })]),
      makeChapter("c2", 1, [makeSection("s2", "Second", { isChapter: true })]),
    ]);
    const pages = buildViewerPages(story);
    const openers = pages.filter((p) => p.pageKind === "chapter-opener") as Array<{ chapterNumber: string }>;
    expect(openers[0]!.chapterNumber).toBe("Chapter One");
    expect(openers[1]!.chapterNumber).toBe("Chapter Two");
  });

  it("renders non-isChapter chapters as essay pages with 'Front matter' label before any story chapter", () => {
    const story = makeStory("Story", [
      makeChapter("front", 0, [makeSection("f1", "Intro", { isChapter: false })]),
      makeChapter("main", 1, [makeSection("m1", "Chapter", { isChapter: true })]),
    ]);
    const pages = buildViewerPages(story);
    const essayPage = pages.find((p) => p.pageKind === "essay") as { kindLabel: string } | undefined;
    expect(essayPage?.kindLabel).toBe("Front matter");
  });

  it("labels essay pages after story chapters as 'Back matter'", () => {
    const story = makeStory("Story", [
      makeChapter("main", 0, [makeSection("m1", "Chapter", { isChapter: true })]),
      makeChapter("back", 1, [makeSection("b1", "Epilogue", { isChapter: false })]),
    ]);
    const pages = buildViewerPages(story);
    const essayPage = pages.find((p) => p.pageKind === "essay") as { kindLabel: string } | undefined;
    expect(essayPage?.kindLabel).toBe("Back matter");
  });

  it("sorts chapters by sortOrder before building pages", () => {
    const story = makeStory("Story", [
      makeChapter("c2", 1, [makeSection("s2", "Second", { isChapter: true })]),
      makeChapter("c1", 0, [makeSection("s1", "First", { isChapter: true })]),
    ]);
    const pages = buildViewerPages(story);
    const openers = pages.filter((p) => p.pageKind === "chapter-opener") as Array<{ id: string }>;
    expect(openers[0]!.id).toBe("s1");
    expect(openers[1]!.id).toBe("s2");
  });
});

// ── buildViewerToc ────────────────────────────────────────────────────────────

describe("buildViewerToc", () => {
  it("returns empty TOC for a cover-only page list", () => {
    const pages = buildViewerPages(makeStory("Story", []));
    expect(buildViewerToc(pages)).toEqual([]);
  });

  it("adds one chapter entry per chapter-opener", () => {
    const story = makeStory("Story", [
      makeChapter("c1", 0, [makeSection("s1", "Chapter One", { isChapter: true })]),
    ]);
    const pages = buildViewerPages(story);
    const toc = buildViewerToc(pages);
    expect(toc).toHaveLength(1);
    expect(toc[0]).toMatchObject({ kind: "chapter", title: "Chapter One", chapterId: "c1" });
  });

  it("adds body pages as children of their chapter TOC entry", () => {
    const story = makeStory("Story", [
      makeChapter("c1", 0, [
        makeSection("s1", "Opener", { isChapter: true }),
        makeSection("s2", "Body Page", { isChapter: false }),
      ]),
    ]);
    const pages = buildViewerPages(story);
    const toc = buildViewerToc(pages);
    expect(toc[0]!.children).toHaveLength(1);
    expect(toc[0]!.children[0]!.title).toBe("Body Page");
  });

  it("adds essay pages as standalone entries with no children", () => {
    const story = makeStory("Story", [
      makeChapter("front", 0, [makeSection("f1", "Preface", { isChapter: false })]),
    ]);
    const pages = buildViewerPages(story);
    const toc = buildViewerToc(pages);
    expect(toc).toHaveLength(1);
    expect(toc[0]).toMatchObject({ kind: "standalone", title: "Preface", children: [] });
  });

  it("sets correct pageIndex for each TOC entry", () => {
    const story = makeStory("Story", [
      makeChapter("c1", 0, [makeSection("s1", "Ch1", { isChapter: true })]),
    ]);
    const pages = buildViewerPages(story);
    const toc = buildViewerToc(pages);
    // cover is index 0; chapter-opener is index 1
    expect(toc[0]!.pageIndex).toBe(1);
  });
});
