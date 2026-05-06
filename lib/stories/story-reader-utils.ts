import { StoryKind } from "@ligneous/prisma";
import type { StoryPublicPayload } from "@/lib/stories/story-queries";

export type ReaderStoryBlock = {
  id: string;
  type: string;
  dateAnnotation?: {
    date: string;
    dateDisplay: string;
    endDate?: string;
  };
  [key: string]: unknown;
};

export type ReaderSection = {
  id: string;
  title: string;
  isChapter?: boolean;
  isPage?: boolean;
  blocks: ReaderStoryBlock[];
  children?: ReaderSection[];
};

export type TocEntry = {
  sectionId: string;
  title: string;
  depth: number;
  anchorId: string;
};

export type TimelineBlock = {
  sectionId: string;
  blockId: string;
  date: string;
  dateDisplay: string;
  endDate?: string;
};

function parseBlocks(json: unknown): ReaderStoryBlock[] {
  if (!json || typeof json !== "object") return [];
  const blocks = (json as { blocks?: unknown }).blocks;
  return Array.isArray(blocks) ? (blocks as ReaderStoryBlock[]) : [];
}

/** Rebuilds the same outline shape as admin `dbRecordToStoryDocument` (single section vs nested). */
export function prismaStoryToReaderSections(story: StoryPublicPayload): ReaderSection[] {
  const roots: ReaderSection[] = [];
  const chapters = [...story.chapters].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const ch of chapters) {
    const secs = [...ch.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    if (secs.length === 1 && secs[0].title === ch.title) {
      const s0 = secs[0];
      roots.push({
        id: s0.id,
        title: s0.title,
        isChapter: s0.isChapter ?? false,
        isPage: s0.isPage ?? false,
        blocks: parseBlocks(s0.contentJson),
      });
    } else {
      const chapterFlag = secs[0]?.isChapter ?? false;
      const pageFlag = secs[0]?.isPage ?? false;
      roots.push({
        id: ch.id,
        title: ch.title,
        isChapter: chapterFlag,
        isPage: pageFlag,
        blocks: [],
        children: secs.map((s) => ({
          id: s.id,
          title: s.title,
          blocks: parseBlocks(s.contentJson),
        })),
      });
    }
  }
  return roots;
}

export function sectionToBlocks(section: { contentJson: unknown }): ReaderStoryBlock[] {
  return parseBlocks(section.contentJson);
}

function walkBlocks(blocks: ReaderStoryBlock[], fn: (b: ReaderStoryBlock) => void): void {
  for (const b of blocks) {
    fn(b);
    if (b.type === "container") {
      const ch = (b as unknown as { children?: ReaderStoryBlock[] }).children;
      if (Array.isArray(ch)) walkBlocks(ch, fn);
    }
    if (b.type === "columns") {
      const cols = (b as unknown as { columns?: { blocks: ReaderStoryBlock[] }[] }).columns;
      if (Array.isArray(cols)) {
        for (const col of cols) {
          walkBlocks(col.blocks ?? [], fn);
        }
      }
    }
  }
}

function flattenReaderSections(sections: ReaderSection[]): ReaderSection[] {
  const out: ReaderSection[] = [];
  function walk(list: ReaderSection[]) {
    for (const s of list) {
      if (s.children?.length) {
        for (const c of s.children) out.push(c);
      } else {
        out.push(s);
      }
    }
  }
  walk(sections);
  return out;
}

/** Flat `StorySection` rows in chapter/section order (for pagination / anchors). */
export function flattenDbSectionRows(story: StoryPublicPayload): Array<{
  id: string;
  title: string;
  contentJson: unknown;
  isChapter: boolean;
  isPage: boolean;
}> {
  const rows: Array<{ id: string; title: string; contentJson: unknown; isChapter: boolean; isPage: boolean }> = [];
  const chapters = [...story.chapters].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const ch of chapters) {
    const secs = [...ch.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const s of secs) {
      rows.push({
        id: s.id,
        title: s.title,
        contentJson: s.contentJson,
        isChapter: s.isChapter ?? false,
        isPage: s.isPage ?? false,
      });
    }
  }
  return rows;
}

export function buildToc(story: StoryPublicPayload): TocEntry[] {
  const docKind = story.kind;
  if (docKind === StoryKind.post) return [];

  const roots = prismaStoryToReaderSections(story);

  if (docKind === StoryKind.article) {
    const flat = flattenReaderSections(roots);
    return flat.map((s) => ({
      sectionId: s.id,
      title: s.title,
      depth: 0,
      anchorId: `section-${s.id}`,
    }));
  }

  const toc: TocEntry[] = [];
  for (const r of roots) {
    if (r.children?.length) {
      if (r.isChapter) {
        const first = r.children[0]!;
        toc.push({
          sectionId: first.id,
          title: r.title,
          depth: 0,
          anchorId: `section-${first.id}`,
        });
        for (const ch of r.children.slice(1)) {
          toc.push({
            sectionId: ch.id,
            title: ch.title,
            depth: 1,
            anchorId: `section-${ch.id}`,
          });
        }
      } else {
        for (const ch of r.children) {
          toc.push({
            sectionId: ch.id,
            title: ch.title,
            depth: 0,
            anchorId: `section-${ch.id}`,
          });
        }
      }
    } else {
      toc.push({
        sectionId: r.id,
        title: r.title,
        depth: 0,
        anchorId: `section-${r.id}`,
      });
    }
  }
  return toc;
}

export function extractTimelineBlocks(story: StoryPublicPayload): TimelineBlock[] {
  const roots = prismaStoryToReaderSections(story);
  const flat = flattenReaderSections(roots);
  const hits: TimelineBlock[] = [];
  for (const sec of flat) {
    walkBlocks(sec.blocks, (b) => {
      const ann = b.dateAnnotation;
      if (!ann?.date?.trim() || !ann.dateDisplay?.trim()) return;
      hits.push({
        sectionId: sec.id,
        blockId: b.id,
        date: ann.date.trim(),
        dateDisplay: ann.dateDisplay.trim(),
        endDate: ann.endDate?.trim() || undefined,
      });
    });
  }
  hits.sort((a, b) => a.date.localeCompare(b.date));
  return hits;
}
