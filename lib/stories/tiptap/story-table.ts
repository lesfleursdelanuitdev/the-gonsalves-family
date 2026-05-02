import { mergeAttributes } from "@tiptap/core";
import { Table, createColGroup } from "@tiptap/extension-table";

export const StoryTable = Table.extend({
  renderHTML({ node, HTMLAttributes }) {
    const { colgroup, tableWidth, tableMinWidth } = createColGroup(node, this.options.cellMinWidth);
    const userStyles = HTMLAttributes.style as string | undefined;
    function getTableStyle(): string {
      if (userStyles) return userStyles;
      return tableWidth ? `width: ${tableWidth}` : `min-width: ${tableMinWidth}`;
    }
    const table = [
      "table",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "story-table",
        style: getTableStyle(),
      }),
      colgroup,
      ["tbody", 0],
    ] as const;
    return ["div", { class: "story-table-wrapper" }, table] as const;
  },
});
