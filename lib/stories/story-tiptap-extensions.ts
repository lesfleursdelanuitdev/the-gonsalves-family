import type { AnyExtension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import type { StoryFieldKey } from "@/lib/stories/tiptap/field-keys";
import { StoryField } from "@/lib/stories/tiptap/story-field-extension";
import { StoryTable } from "@/lib/stories/tiptap/story-table";
import { StoryBulletList } from "@/lib/stories/tiptap/story-bullet-list";
import { StoryLink } from "@/lib/stories/tiptap/story-link-extension";
import { PublicStoryFlowEmbed, PublicStoryFlowMedia } from "@/lib/stories/story-flow-node-extensions";

export type CreateStoryTipTapExtensionsOptions = {
  storyFieldHtml?: (field: StoryFieldKey) => string;
};

/** Same extension set as the Story Creator (`story-tiptap-extensions.ts` in admin); classes use site tokens. */
export function createStoryTipTapReadExtensions(opts?: CreateStoryTipTapExtensionsOptions): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: false,
      bulletList: false,
      codeBlock: {
        HTMLAttributes: {
          class: "rounded-lg bg-surface-2 p-3 font-mono text-sm",
        },
      },
    }),
    StoryLink.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: {
        class: "text-link underline underline-offset-2",
      },
    }),
    Highlight.configure({
      multicolor: false,
      HTMLAttributes: {
        class: "bg-warning/35",
      },
    }),
    TextStyle.configure({
      mergeNestedSpanStyles: true,
      HTMLAttributes: {
        class: "story-text-style",
      },
    }),
    FontSize.configure({
      types: ["textStyle"],
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    TableKit.configure({
      table: false,
      tableCell: {
        HTMLAttributes: { class: "story-table-cell border border-border px-2 py-1 align-top" },
      },
      tableHeader: {
        HTMLAttributes: { class: "story-table-header-cell border border-border bg-surface-2 px-2 py-1 font-semibold" },
      },
      tableRow: {
        HTMLAttributes: { class: "story-table-row" },
      },
    }),
    StoryTable.configure({
      resizable: false,
      HTMLAttributes: { class: "story-table" },
    }),
    StoryBulletList,
    StoryField.configure({
      resolveFieldForHtml: opts?.storyFieldHtml ?? (() => ""),
    }),
    PublicStoryFlowMedia,
    PublicStoryFlowEmbed,
  ];
}
