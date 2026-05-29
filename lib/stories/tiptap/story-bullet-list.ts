import { BulletList } from "@tiptap/extension-bullet-list";

export type BulletListStyle = "disc" | "circle" | "square" | "none";

export const StoryBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyle: {
        default: "disc" as BulletListStyle,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute("data-list-style");
          if (v === "circle" || v === "square" || v === "none") return v;
          return "disc";
        },
        renderHTML: (attrs: Record<string, unknown>) => {
          const s = attrs.listStyle as BulletListStyle;
          if (!s || s === "disc") return {};
          return { "data-list-style": s };
        },
      },
    };
  },
});
