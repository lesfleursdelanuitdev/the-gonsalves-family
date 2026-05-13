"use client";

import { useMemo, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import { PublicStoryTimelineEmbed } from "@/components/stories/PublicStoryTimelineEmbed";
import type { ReaderStoryBlock } from "@/lib/stories/story-reader-utils";
import { renderStoryRichTextToHtml } from "@/lib/stories/render-story-rich-text";
import type { StoryFieldKey } from "@/lib/stories/tiptap/field-keys";

const EMBED_LABELS: Record<string, string> = {
  document: "Document",
  timeline: "Timeline",
  map: "Map",
  tree: "Tree",
  graph: "Graph",
};

function EmbedPlaceholder({ label }: { label: string }) {
  return (
    <div className="my-6 rounded-xl border border-dashed border-border bg-surface-2/60 px-4 py-10 text-center text-sm text-text/70">
      {label} embed (preview not wired on the public site yet)
    </div>
  );
}

export function StoryBlockRenderer({
  block,
  storyFieldHtml,
  highlight,
}: {
  block: ReaderStoryBlock;
  storyFieldHtml?: (field: StoryFieldKey) => string;
  highlight?: boolean;
}) {
  const html = useMemo(() => {
    if (block.type !== "richText") return "";
    const doc = block.doc as JSONContent | undefined;
    if (!doc) return "";
    return renderStoryRichTextToHtml(doc, storyFieldHtml);
  }, [block, storyFieldHtml]);

  const wrap = (inner: ReactNode) => (
    <div
      id={`block-${block.id}`}
      className={highlight ? "rounded-lg border-l-4 border-primary bg-primary/5 pl-3 py-1" : undefined}
    >
      {inner}
    </div>
  );

  if (block.type === "richText") {
    return wrap(
      <div
        className="story-rich-text prose prose-neutral max-w-none text-text dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />,
    );
  }

  if (block.type === "media") {
    return wrap(
      <div className="my-6 rounded-xl border border-border bg-surface-2/50 p-4 text-sm text-text/75">Media block</div>,
    );
  }

  if (block.type === "embed") {
    const k = String((block as { embedKind?: string }).embedKind ?? "document");
    if (k === "timeline") {
      return wrap(<PublicStoryTimelineEmbed block={block} />);
    }
    return wrap(<EmbedPlaceholder label={EMBED_LABELS[k] ?? "Embed"} />);
  }

  if (block.type === "columns") {
    return wrap(
      <div className="my-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-surface-2/40 p-3 text-xs text-text/60">Column A</div>
        <div className="rounded-lg border border-border/60 bg-surface-2/40 p-3 text-xs text-text/60">Column B</div>
      </div>,
    );
  }

  if (block.type === "divider") {
    return wrap(<hr className="my-8 border-border" />);
  }

  if (block.type === "container") {
    return wrap(
      <div className="my-4 rounded-xl border border-border/70 bg-surface-2/30 p-4 text-sm text-text/70">Container</div>,
    );
  }

  return wrap(
    <div className="my-2 rounded border border-dashed border-border px-3 py-2 text-xs text-text/55">
      Unsupported block: {block.type}
    </div>,
  );
}
