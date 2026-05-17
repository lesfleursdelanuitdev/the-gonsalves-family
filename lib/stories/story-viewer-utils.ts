import type { StoryPublicPayload } from "@/lib/stories/story-queries";
import type { ReaderStoryBlock } from "@/lib/stories/story-reader-utils";

const CHAPTER_ORDINALS = [
  "One", "Two", "Three", "Four", "Five",
  "Six", "Seven", "Eight", "Nine", "Ten",
];

function chapterOrdinalLabel(n: number): string {
  return CHAPTER_ORDINALS[n] ? `Chapter ${CHAPTER_ORDINALS[n]}` : `Chapter ${n + 1}`;
}

function parseBlocksFromJson(json: unknown): ReaderStoryBlock[] {
  if (!json || typeof json !== "object") return [];
  const blocks = (json as { blocks?: unknown }).blocks;
  return Array.isArray(blocks) ? (blocks as ReaderStoryBlock[]) : [];
}

// ── Page kinds ────────────────────────────────────────────────────────────────

export type ViewerCoverPage = {
  pageKind: "cover";
  id: "cover";
  chapterId: null;
  title: string;
};

export type ViewerChapterOpenerPage = {
  pageKind: "chapter-opener";
  id: string;
  chapterId: string;
  chapterNumber: string;
  title: string;
  subtitle: string | null;
  folio: number;
};

export type ViewerBodyPage = {
  pageKind: "body";
  id: string;
  chapterId: string;
  title: string;
  blocks: ReaderStoryBlock[];
  folio: number;
};

export type ViewerEssayPage = {
  pageKind: "essay";
  id: string;
  chapterId: null;
  title: string;
  subtitle: string | null;
  kindLabel: string;
  blocks: ReaderStoryBlock[];
  folio: number;
};

export type ViewerPage =
  | ViewerCoverPage
  | ViewerChapterOpenerPage
  | ViewerBodyPage
  | ViewerEssayPage;

// ── TOC ───────────────────────────────────────────────────────────────────────

export type ViewerTocEntry = {
  kind: "chapter" | "standalone";
  label: string;
  title: string;
  pageIndex: number;
  chapterId: string | null;
  folio: number | null;
  children: { title: string; pageIndex: number; folio: number }[];
};

// ── buildViewerPages ──────────────────────────────────────────────────────────

export function buildViewerPages(story: StoryPublicPayload): ViewerPage[] {
  const pages: ViewerPage[] = [];

  // Page 0 is always the cover
  pages.push({ pageKind: "cover", id: "cover", chapterId: null, title: story.title });

  const chapters = [...story.chapters].sort((a, b) => a.sortOrder - b.sortOrder);

  // Classify each chapter as a story-chapter (has isChapter section) or essay-group
  type ChapterGroup = {
    chapterId: string;
    isStoryChapter: boolean;
    sections: StoryPublicPayload["chapters"][0]["sections"];
  };

  const groups: ChapterGroup[] = chapters.map((ch) => {
    const secs = [...ch.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      chapterId: ch.id,
      isStoryChapter: secs.some((s) => s.isChapter),
      sections: secs,
    };
  });

  const firstStoryChapterIdx = groups.findIndex((g) => g.isStoryChapter);
  let chapterCount = 0;

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]!;

    if (group.isStoryChapter) {
      const chapterNumber = chapterOrdinalLabel(chapterCount++);

      for (let si = 0; si < group.sections.length; si++) {
        const s = group.sections[si]!;
        const folio = pages.length;

        if (si === 0) {
          pages.push({
            pageKind: "chapter-opener",
            id: s.id,
            chapterId: group.chapterId,
            chapterNumber,
            title: s.title,
            subtitle: s.subtitle ?? null,
            folio,
          });
        } else {
          pages.push({
            pageKind: "body",
            id: s.id,
            chapterId: group.chapterId,
            title: s.title,
            blocks: parseBlocksFromJson(s.contentJson),
            folio,
          });
        }
      }
    } else {
      const isBeforeChapters = firstStoryChapterIdx < 0 || gi < firstStoryChapterIdx;
      const kindLabel = isBeforeChapters ? "Front matter" : "Back matter";

      for (const s of group.sections) {
        const folio = pages.length;
        pages.push({
          pageKind: "essay",
          id: s.id,
          chapterId: null,
          title: s.title,
          subtitle: s.subtitle ?? null,
          kindLabel,
          blocks: parseBlocksFromJson(s.contentJson),
          folio,
        });
      }
    }
  }

  return pages;
}

// ── buildViewerToc ────────────────────────────────────────────────────────────

export function buildViewerToc(pages: ViewerPage[]): ViewerTocEntry[] {
  const toc: ViewerTocEntry[] = [];
  const seenChapters = new Set<string>();

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]!;
    if (p.pageKind === "cover") continue;

    if (p.pageKind === "chapter-opener") {
      if (!seenChapters.has(p.chapterId)) {
        seenChapters.add(p.chapterId);
        const children: { title: string; pageIndex: number; folio: number }[] = [];
        for (let j = i + 1; j < pages.length; j++) {
          const next = pages[j]!;
          if (next.pageKind === "body" && next.chapterId === p.chapterId) {
            children.push({ title: next.title, pageIndex: j, folio: next.folio });
          } else break;
        }
        toc.push({
          kind: "chapter",
          label: p.chapterNumber,
          title: p.title,
          pageIndex: i,
          chapterId: p.chapterId,
          folio: p.folio,
          children,
        });
      }
    } else if (p.pageKind === "essay") {
      toc.push({
        kind: "standalone",
        label: p.kindLabel,
        title: p.title,
        pageIndex: i,
        chapterId: null,
        folio: p.folio,
        children: [],
      });
    }
    // body pages appear only as children under their chapter
  }

  return toc;
}
