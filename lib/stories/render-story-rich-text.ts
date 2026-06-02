import { generateHTML, type JSONContent } from "@tiptap/core";
import type { StoryFieldKey } from "@/lib/stories/tiptap/field-keys";
import { createStoryTipTapReadExtensions } from "@/lib/stories/story-tiptap-extensions";

const extensions = createStoryTipTapReadExtensions();

export function renderStoryRichTextToHtml(
  doc: JSONContent | Record<string, unknown>,
  storyFieldHtml?: (field: StoryFieldKey) => string,
): string {
  // TipTap's generateHTML uses the DOM (document.implementation) — client only.
  if (typeof document === "undefined") return "";
  const exts = storyFieldHtml ? createStoryTipTapReadExtensions({ storyFieldHtml }) : extensions;
  return generateHTML(doc as JSONContent, exts);
}

type RichTextNode = {
  type?: string;
  content?: RichTextNode[];
  attrs?: Record<string, unknown>;
} & Record<string, unknown>;

/**
 * Remove inline `storyField` chips (title / subtitle / author) from a rich-text
 * doc before rendering. Used by article bodies, where these fields are already
 * shown in the cover header and would otherwise render a second time inline.
 * Block nodes (paragraph/heading) that contained a removed chip and end up empty
 * are pruned so no blank line is left behind; pre-existing empty paragraphs are
 * left untouched.
 */
export function stripStoryFieldChips(
  doc: JSONContent | Record<string, unknown>,
  fields: readonly StoryFieldKey[],
): JSONContent {
  if (!fields || fields.length === 0) return doc as JSONContent;
  const remove = new Set<string>(fields);
  const isTargetChip = (n: RichTextNode): boolean =>
    !!n && n.type === "storyField" && typeof n.attrs?.field === "string" && remove.has(n.attrs.field as string);

  const transform = (node: RichTextNode): RichTextNode | null => {
    if (!node || typeof node !== "object") return node;
    if (isTargetChip(node)) return null;
    if (Array.isArray(node.content)) {
      const containedChip = node.content.some(isTargetChip);
      const content = node.content
        .map((child) => transform(child))
        .filter((child): child is RichTextNode => child != null);
      if (containedChip && content.length === 0 && (node.type === "paragraph" || node.type === "heading")) {
        return null;
      }
      return { ...node, content };
    }
    return node;
  };

  return (transform(doc as RichTextNode) ?? { type: "doc", content: [] }) as JSONContent;
}
