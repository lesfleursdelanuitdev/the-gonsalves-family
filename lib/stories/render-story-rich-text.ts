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
