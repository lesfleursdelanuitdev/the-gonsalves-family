"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import { PublicStoryTimelineEmbed } from "@/components/stories/PublicStoryTimelineEmbed";
import { PublicStoryMediaBlock } from "@/components/stories/PublicStoryMediaBlock";
import type { ReaderStoryBlock } from "@/lib/stories/story-reader-utils";
import { renderStoryRichTextToHtml } from "@/lib/stories/render-story-rich-text";
import type { StoryFieldKey } from "@/lib/stories/tiptap/field-keys";
import "./story-flow-nodes.css";

const EMBED_LABELS: Record<string, string> = {
  document: "Document",
  timeline: "Timeline",
  map: "Map",
  tree: "Tree",
  graph: "Graph",
  recipe: "Recipe",
  gallery: "Gallery",
  personSpotlight: "Person spotlight",
  familyGroup: "Family group",
  event: "Event",
};

function EmbedPlaceholder({ label }: { label: string }) {
  return (
    <div className="my-6 rounded-xl border border-dashed border-border bg-surface-2/60 px-4 py-10 text-center text-sm text-text/70">
      {label} embed (preview not wired on the public site yet)
    </div>
  );
}

function textFromTipTapDoc(doc: unknown): string {
  const collect = (node: unknown): string => {
    if (!node || typeof node !== "object") return "";
    const record = node as { type?: unknown; text?: unknown; content?: unknown };
    if (typeof record.text === "string") return record.text;
    if (!Array.isArray(record.content)) return "";
    const inner = record.content.map(collect).join("");
    return record.type === "paragraph" || record.type === "heading" ? `${inner}\n` : inner;
  };
  if (!doc || typeof doc !== "object" || !Array.isArray((doc as { content?: unknown }).content)) return "";
  return (doc as { content: unknown[] }).content
    .map((child) => collect(child).replace(/\n$/, ""))
    .join("\n")
    .trimEnd();
}

function lineDocsFromTipTapDoc(doc: unknown): JSONContent[] {
  if (!doc || typeof doc !== "object" || !Array.isArray((doc as { content?: unknown }).content)) return [];
  return (doc as { content: JSONContent[] }).content.map((node) => ({
    type: "doc",
    content: [node],
  }));
}

function alignClass(value: unknown): string {
  if (value === "left") return "text-left";
  if (value === "right") return "text-right";
  return "text-center";
}

function columnsMobileClass(block: ReaderStoryBlock): string {
  if (block.mobileBehavior === "keepSideBySide") return "grid-cols-2";
  if (block.mobileBehavior === "stackRightFirst") {
    return "grid-cols-1 md:grid-cols-2 [&>*:first-child]:order-2 [&>*:last-child]:order-1 md:[&>*:first-child]:order-none md:[&>*:last-child]:order-none";
  }
  return "grid-cols-1 md:grid-cols-2";
}

function staggerStyle(align: unknown, index: number): CSSProperties | undefined {
  const step = index % 4;
  const offset = step === 1 || step === 3 ? "1.25rem" : step === 2 ? "2.5rem" : "0rem";
  if (offset === "0rem") return undefined;
  if (align === "right") return { marginRight: offset };
  if (align === "center") return { transform: `translateX(${step === 1 ? "-" : ""}${offset})` };
  return { marginLeft: offset };
}

function verseOuterClass(block: ReaderStoryBlock): string {
  const rowLayout = block.rowLayout && typeof block.rowLayout === "object" ? (block.rowLayout as { alignment?: unknown }) : {};
  const margin = rowLayout.alignment === "left" ? "mr-auto" : rowLayout.alignment === "right" ? "ml-auto" : "mx-auto";
  return `my-6 max-w-2xl font-serif text-text ${margin}`;
}

function VerseBlock({ block, storyFieldHtml }: { block: ReaderStoryBlock; storyFieldHtml?: (field: StoryFieldKey) => string }) {
  const title = typeof block.verseTitle === "string" ? block.verseTitle.trim() : "";
  const docText = textFromTipTapDoc(block.doc);
  const content = typeof block.verseContent === "string" ? block.verseContent : docText;
  const lines = content ? content.split(/\r?\n/) : [];
  const [richLineHtml, setRichLineHtml] = useState<string[]>([]);

  useEffect(() => {
    if (!docText.trim()) {
      setRichLineHtml([]);
      return;
    }
    setRichLineHtml(
      lineDocsFromTipTapDoc(block.doc).map((lineDoc) => renderStoryRichTextToHtml(lineDoc, storyFieldHtml)),
    );
  }, [block.doc, docText, storyFieldHtml]);
  const contentAlign = block.verseContentAlign;
  const staggered = block.verseLineLayout === "staggered";
  const gap = block.verseSpacing === "compact" ? "gap-0.5" : "gap-2";
  const hasRichLines = richLineHtml.length > 0;
  const hasLines = hasRichLines || lines.length > 0;

  return (
    <div className={verseOuterClass(block)}>
      {title ? <p className={`font-semibold leading-snug ${alignClass(block.verseTitleAlign)}`}>{title}</p> : null}
      {hasLines ? (
        <div className={`flex flex-col whitespace-pre-wrap text-[0.98rem] italic leading-[1.75] ${gap} ${title ? "mt-6" : ""} ${alignClass(contentAlign)}`}>
          {hasRichLines
            ? richLineHtml.map((html, index) => (
                <div
                  key={`${index}-${html}`}
                  className="story-verse-line inline-block min-h-[1lh] [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/35 [&_a]:underline-offset-4 [&_p]:m-0 [&_p]:leading-[inherit]"
                  style={staggered ? staggerStyle(contentAlign, index) : undefined}
                  dangerouslySetInnerHTML={{ __html: html || "<p>&nbsp;</p>" }}
                />
              ))
            : lines.map((line, index) => (
                <span key={`${index}-${line}`} className="inline-block min-h-[1lh]" style={staggered ? staggerStyle(contentAlign, index) : undefined}>
                  {line || "\u00A0"}
                </span>
              ))}
        </div>
      ) : null}
    </div>
  );
}

export type StoryFields = { title: string; subtitle: string; author: string };

export function StoryBlockRenderer({
  block,
  storyFieldHtml,
  storyFields,
  highlight,
}: {
  block: ReaderStoryBlock;
  /** Pass a pre-built function when already on the client (e.g. inside StoryViewerShell). */
  storyFieldHtml?: (field: StoryFieldKey) => string;
  /** Pass plain strings when calling from a server component — the function is created here. */
  storyFields?: StoryFields;
  highlight?: boolean;
}) {
  const resolvedFieldHtml = useMemo<((f: StoryFieldKey) => string) | undefined>(() => {
    if (storyFieldHtml) return storyFieldHtml;
    if (storyFields) return (f) => {
      if (f === "title") return storyFields.title;
      if (f === "subtitle") return storyFields.subtitle;
      return storyFields.author;
    };
    return undefined;
  }, [storyFieldHtml, storyFields]);

  const [html, setHtml] = useState("");

  useEffect(() => {
    if (block.type !== "richText") {
      setHtml("");
      return;
    }
    const doc = block.doc as JSONContent | undefined;
    if (!doc) {
      setHtml("");
      return;
    }
    setHtml(renderStoryRichTextToHtml(doc, resolvedFieldHtml));
  }, [block, resolvedFieldHtml]);

  const wrap = (inner: ReactNode) => (
    <div
      id={`block-${block.id}`}
      className={highlight ? "rounded-lg border-l-4 border-primary bg-primary/5 pl-3 py-1" : undefined}
    >
      {inner}
    </div>
  );

  if (block.type === "richText") {
    const preset = block.preset ?? block.textPreset;
    if (preset === "verse") {
      return wrap(<VerseBlock block={block} storyFieldHtml={resolvedFieldHtml} />);
    }
    return wrap(
      <div
        className="story-rich-text max-w-none text-text"
        dangerouslySetInnerHTML={{ __html: html }}
      />,
    );
  }

  if (block.type === "splitContent") {
    const textBlock = block.text as ReaderStoryBlock | undefined;
    const supporting = block.supporting as { blocks?: ReaderStoryBlock[] } | undefined;
    const supportBlocks = supporting?.blocks ?? [];
    const supportPct = typeof block.supportingWidthPct === "number" ? block.supportingWidthPct : 35;
    const floatDir = block.supportingSide === "left" ? "left" : "right";
    return wrap(
      <div className="my-4" style={{ overflow: "hidden" }}>
        {supportBlocks.length > 0 ? (
          <div
            style={{
              float: floatDir,
              width: `${supportPct}%`,
              marginLeft: floatDir === "right" ? "1.5rem" : 0,
              marginRight: floatDir === "left" ? "1.5rem" : 0,
              marginBottom: "0.5rem",
            }}
          >
            {supportBlocks.map((b, i) => (
              <StoryBlockRenderer key={b.id ?? i} block={b} storyFieldHtml={resolvedFieldHtml} />
            ))}
          </div>
        ) : null}
        {textBlock ? <StoryBlockRenderer block={textBlock} storyFieldHtml={resolvedFieldHtml} /> : null}
      </div>,
    );
  }

  if (block.type === "media") {
    return wrap(<PublicStoryMediaBlock block={block} />);
  }

  if (block.type === "embed") {
    const k = String((block as { embedKind?: string }).embedKind ?? "document");
    if (k === "timeline") {
      return wrap(<PublicStoryTimelineEmbed block={block} />);
    }
    return wrap(<EmbedPlaceholder label={EMBED_LABELS[k] ?? "Embed"} />);
  }

  if (block.type === "columns") {
    const cols = (block.columns as Array<{ id: string; blocks: ReaderStoryBlock[] }> | undefined) ?? [];
    const widths = (block.columnWidthPercents as number[] | undefined) ?? cols.map(() => 100 / Math.max(cols.length, 1));
    const templateCols = widths.map((w) => `${w}fr`).join(" ");
    return wrap(
      <div
        className={`my-6 gap-4 ${columnsMobileClass(block)}`}
        style={{ display: "grid", gridTemplateColumns: templateCols }}
      >
        {cols.map((col) => (
          <div key={col.id} className="min-w-0">
            {col.blocks.map((b, j) => (
              <StoryBlockRenderer key={b.id ?? j} block={b} storyFieldHtml={resolvedFieldHtml} />
            ))}
          </div>
        ))}
      </div>,
    );
  }

  if (block.type === "divider") {
    return wrap(<hr className="my-8 border-border" />);
  }

  if (block.type === "container") {
    const children = (block.children as ReaderStoryBlock[] | undefined) ?? [];
    return wrap(
      <div className="my-4 rounded-xl border border-border/60 bg-surface-2/30 p-4">
        {children.map((b, i) => (
          <StoryBlockRenderer key={b.id ?? i} block={b} storyFieldHtml={resolvedFieldHtml} />
        ))}
      </div>,
    );
  }

  return wrap(
    <div className="my-2 rounded border border-dashed border-border px-3 py-2 text-xs text-text/55">
      Unsupported block: {block.type}
    </div>,
  );
}
