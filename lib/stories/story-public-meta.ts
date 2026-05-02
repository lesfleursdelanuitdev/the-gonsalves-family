export type AuthorPrefixMode = "by" | "author_label" | "custom" | "none";

const META_V = "ligneous-story-meta/1";

export function parseStoryBodyMeta(body: string | null | undefined): {
  author?: string;
  authorPrefixMode?: AuthorPrefixMode;
  authorPrefixCustom?: string;
} {
  const t = (body ?? "").trim();
  if (!t.startsWith("{")) return {};
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    if (o.v !== META_V) return {};
    const out: { author?: string; authorPrefixMode?: AuthorPrefixMode; authorPrefixCustom?: string } = {};
    if (typeof o.author === "string") out.author = o.author;
    if (o.authorPrefixMode === "by" || o.authorPrefixMode === "author_label" || o.authorPrefixMode === "custom" || o.authorPrefixMode === "none") {
      out.authorPrefixMode = o.authorPrefixMode;
    }
    if (typeof o.authorPrefixCustom === "string") out.authorPrefixCustom = o.authorPrefixCustom;
    return out;
  } catch {
    return {};
  }
}

export function formatPublicAuthorLine(
  meta: { author?: string; authorPrefixMode?: AuthorPrefixMode; authorPrefixCustom?: string },
  dbAuthorName: string | null | undefined,
): string | null {
  const n = (meta.author?.trim() || dbAuthorName?.trim() || "").trim();
  if (!n) return null;
  const mode = meta.authorPrefixMode ?? "by";
  if (mode === "none") return n;
  if (mode === "by") return `By ${n}`;
  if (mode === "author_label") return `Author: ${n}`;
  const custom = (meta.authorPrefixCustom ?? "").trim();
  if (!custom) return n;
  return /\s$/.test(custom) ? `${custom}${n}` : `${custom} ${n}`;
}
