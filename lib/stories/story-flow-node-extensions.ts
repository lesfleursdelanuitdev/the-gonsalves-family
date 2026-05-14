import { mergeAttributes, Node } from "@tiptap/core";

const FLOW_EMBED_KINDS = new Set(["timeline", "tree", "gallery", "map", "personSpotlight", "familyGroup", "event"]);

function flowLayout(attrs: Record<string, unknown>) {
  const displayMode = attrs.displayMode === "wrapped" ? "wrapped" : "block";
  let align = attrs.align === "left" || attrs.align === "right" || attrs.align === "center" ? attrs.align : "center";
  let size = attrs.size === "small" || attrs.size === "medium" || attrs.size === "large" || attrs.size === "full" ? attrs.size : "medium";
  if (displayMode === "wrapped") {
    if (align === "center") align = "right";
    if (size === "full") size = "medium";
  }
  return { displayMode, align, size };
}

function flowClass(attrs: Record<string, unknown>) {
  const layout = flowLayout(attrs);
  return [
    "story-flow-object",
    `story-flow-object--${layout.displayMode}`,
    `story-flow-object--${layout.align}`,
    `story-flow-object--${layout.size}`,
  ].join(" ");
}

export const PublicStoryFlowMedia = Node.create({
  name: "storyFlowMedia",
  group: "block",
  atom: true,
  selectable: true,
  defining: true,
  addAttributes() {
    return {
      id: { default: null },
      mediaId: { default: "" },
      mediaType: { default: "image" },
      title: { default: null },
      caption: { default: null },
      alt: { default: null },
      credit: { default: null },
      displayMode: { default: "block" },
      align: { default: "center" },
      size: { default: "medium" },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const title = typeof HTMLAttributes.title === "string" && HTMLAttributes.title.trim() ? HTMLAttributes.title : "Media";
    const caption = typeof HTMLAttributes.caption === "string" && HTMLAttributes.caption.trim() ? HTMLAttributes.caption : "";
    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-story-flow-node": "storyFlowMedia",
        class: flowClass(HTMLAttributes),
      }),
      ["div", { class: "story-flow-object__inner" }, ["div", { class: "media-preview story-flow-object__placeholder" }, title]],
      caption ? ["figcaption", {}, caption] : ["figcaption", { hidden: "hidden" }, ""],
    ];
  },
});

export const PublicStoryFlowEmbed = Node.create({
  name: "storyFlowEmbed",
  group: "block",
  atom: true,
  selectable: true,
  defining: true,
  addAttributes() {
    return {
      id: { default: null },
      title: { default: null },
      caption: { default: null },
      embedKind: { default: "timeline" },
      data: { default: {} },
      presentation: { default: { chrome: "minimal", controls: false } },
      displayMode: { default: "block" },
      align: { default: "center" },
      size: { default: "medium" },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const kind = FLOW_EMBED_KINDS.has(String(HTMLAttributes.embedKind)) ? String(HTMLAttributes.embedKind) : "timeline";
    const title = typeof HTMLAttributes.title === "string" && HTMLAttributes.title.trim() ? HTMLAttributes.title : `${kind} embed`;
    const caption = typeof HTMLAttributes.caption === "string" && HTMLAttributes.caption.trim() ? HTMLAttributes.caption : "";
    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-story-flow-node": "storyFlowEmbed",
        class: flowClass(HTMLAttributes),
      }),
      ["div", { class: "story-flow-object__inner" }, ["div", { class: "story-flow-object__placeholder" }, title]],
      caption ? ["figcaption", {}, caption] : ["figcaption", { hidden: "hidden" }, ""],
    ];
  },
});
