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
  dateAnnotations?: Array<{
    date: string;
    dateDisplay: string;
    endDate?: string;
  }>;
  placeAnnotations?: Array<{
    placeId?: string;
    label: string;
  }>;
  [key: string]: unknown;
};

export type ReaderSection = {
  id: string;
  title: string;
  subtitle?: string | null;
  hideTitle?: boolean;
  hideSubtitle?: boolean;
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
        subtitle: s0.subtitle,
        hideTitle: s0.hideTitle ?? false,
        hideSubtitle: s0.hideSubtitle ?? false,
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
          subtitle: s.subtitle,
          hideTitle: s.hideTitle ?? false,
          hideSubtitle: s.hideSubtitle ?? false,
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

type RichTextDocNode = {
  type?: string;
  text?: string;
  content?: RichTextDocNode[];
  attrs?: { level?: number };
};

function richTextPlainText(doc: unknown): string {
  const collect = (node: RichTextDocNode): string => {
    if (typeof node.text === "string") return node.text;
    if (!Array.isArray(node.content)) return "";
    const inner = node.content.map(collect).join("");
    return node.type === "paragraph" || node.type === "heading" ? `${inner}\n` : inner;
  };
  if (!doc || typeof doc !== "object") return "";
  const content = (doc as RichTextDocNode).content;
  if (!Array.isArray(content)) return "";
  return content
    .map((child) => collect(child).replace(/\n$/, ""))
    .join("\n")
    .trim();
}

function firstHeadingLevel(doc: unknown): number | null {
  if (!doc || typeof doc !== "object" || !Array.isArray((doc as RichTextDocNode).content)) return null;
  for (const node of (doc as RichTextDocNode).content ?? []) {
    if (node.type === "heading" && typeof node.attrs?.level === "number") return node.attrs.level;
  }
  return null;
}

function normalizeArticleCompareText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[–—−]/g, "-");
}

export type ArticleBodySuppressContext = {
  title: string;
  authorNames: readonly string[];
};

/** True when a rich-text block repeats title/byline already shown in the article cover header. */
export function isDuplicateArticleHeaderBlock(
  block: ReaderStoryBlock,
  ctx: ArticleBodySuppressContext,
): boolean {
  if (block.type !== "richText") return false;
  const text = richTextPlainText(block.doc).trim();
  if (!text) return false;

  const preset = String(block.preset ?? block.textPreset ?? "paragraph");
  const normText = normalizeArticleCompareText(text);
  const normTitle = normalizeArticleCompareText(ctx.title);

  if (preset === "heading") {
    const level =
      typeof block.headingLevel === "number" ? block.headingLevel : firstHeadingLevel(block.doc);
    if (level === 1 && normText === normTitle) return true;
  }

  if (preset === "paragraph") {
    const lower = text.toLowerCase();
    if (lower.startsWith("by ")) {
      const names = ctx.authorNames.map((n) => n.trim().toLowerCase()).filter(Boolean);
      if (names.some((name) => lower.includes(name))) return true;
    }
  }

  return false;
}

/** Drop leading title/byline rich-text blocks that duplicate the article cover header. */
export function filterLeadingArticleDuplicateBlocks(
  blocks: ReaderStoryBlock[],
  ctx: ArticleBodySuppressContext,
): ReaderStoryBlock[] {
  let pastLeading = false;
  return blocks.filter((block) => {
    if (pastLeading) return true;
    if (isDuplicateArticleHeaderBlock(block, ctx)) return false;
    pastLeading = true;
    return true;
  });
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
  subtitle: string | null;
  hideTitle: boolean;
  hideSubtitle: boolean;
  contentJson: unknown;
  isChapter: boolean;
  isPage: boolean;
}> {
  const rows: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    hideTitle: boolean;
    hideSubtitle: boolean;
    contentJson: unknown;
    isChapter: boolean;
    isPage: boolean;
  }> = [];
  const chapters = [...story.chapters].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const ch of chapters) {
    const secs = [...ch.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const s of secs) {
      rows.push({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        hideTitle: s.hideTitle ?? false,
        hideSubtitle: s.hideSubtitle ?? false,
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
      const list =
        Array.isArray(b.dateAnnotations) && b.dateAnnotations.length > 0
          ? b.dateAnnotations
          : b.dateAnnotation
            ? [b.dateAnnotation]
            : [];
      for (const ann of list) {
        if (!ann?.date?.trim() || !ann.dateDisplay?.trim()) continue;
        hits.push({
          sectionId: sec.id,
          blockId: b.id,
          date: ann.date.trim(),
          dateDisplay: ann.dateDisplay.trim(),
          endDate: ann.endDate?.trim() || undefined,
        });
      }
    });
  }
  hits.sort((a, b) => a.date.localeCompare(b.date));
  return hits;
}
