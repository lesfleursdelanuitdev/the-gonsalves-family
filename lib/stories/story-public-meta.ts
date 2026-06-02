export type AuthorPrefixMode = "by" | "author_label" | "custom" | "none";

const META_V = "ligneous-story-meta/1";

const PREFIX_MODES = new Set<string>(["by", "author_label", "custom", "none"]);

export type ParsedStoryAuthor = {
  name: string;
  authorPrefixMode?: AuthorPrefixMode;
  authorPrefixCustom?: string;
  personXref?: string;
  personId?: string;
};

export type StoryBodyMetaParsed = {
  authors: ParsedStoryAuthor[];
};

function parsePrefixMode(v: unknown): AuthorPrefixMode | undefined {
  if (typeof v !== "string" || !PREFIX_MODES.has(v)) return undefined;
  return v as AuthorPrefixMode;
}

function parseAuthorsArray(raw: unknown): ParsedStoryAuthor[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedStoryAuthor[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    if (!name) continue;
    const authorPrefixMode = parsePrefixMode(rec.authorPrefixMode);
    const authorPrefixCustom =
      typeof rec.authorPrefixCustom === "string" ? rec.authorPrefixCustom : undefined;
    const personXref = typeof rec.personXref === "string" && rec.personXref ? rec.personXref : undefined;
    const personId = typeof rec.personId === "string" && rec.personId ? rec.personId : undefined;
    out.push({ name, authorPrefixMode, authorPrefixCustom, personXref, personId });
  }
  return out;
}

export function parseStoryBodyMeta(body: string | null | undefined): StoryBodyMetaParsed {
  const t = (body ?? "").trim();
  if (!t.startsWith("{")) return { authors: [] };
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    if (o.v !== META_V) return { authors: [] };
    const fromArr = parseAuthorsArray(o.authors);
    if (fromArr.length > 0) return { authors: fromArr };
    const legacyName = typeof o.author === "string" ? o.author.trim() : "";
    if (legacyName) {
      return {
        authors: [
          {
            name: legacyName,
            authorPrefixMode: parsePrefixMode(o.authorPrefixMode),
            authorPrefixCustom: typeof o.authorPrefixCustom === "string" ? o.authorPrefixCustom : undefined,
          },
        ],
      };
    }
    return { authors: [] };
  } catch {
    return { authors: [] };
  }
}

export type PublicStoryAuthorCredit = {
  role: string | null;
  name: string;
  personId?: string;
  /** Resolved server-side from tree profile / linked media when `personId` is known. */
  avatarUrl?: string | null;
};

/** Role label for split credit UI (TOC, byline, cover). */
export function publicAuthorCreditRole(c: ParsedStoryAuthor): string | null {
  const mode = c.authorPrefixMode ?? "by";
  if (mode === "none") return null;
  if (mode === "by") return "By";
  if (mode === "author_label") return "Author:";
  const custom = (c.authorPrefixCustom ?? "").trim();
  return custom || null;
}

/** Structured credits for story viewer chrome (role + name, not a combined line). */
export function publicAuthorCredits(
  meta: StoryBodyMetaParsed,
  dbAuthorName: string | null | undefined,
): PublicStoryAuthorCredit[] {
  let credits = meta.authors;
  if (credits.length === 0) {
    const n = dbAuthorName?.trim();
    if (n) credits = [{ name: n, authorPrefixMode: "by" }];
  }
  return credits
    .map((c) => {
      const name = c.name?.trim();
      if (!name) return null;
      const credit: PublicStoryAuthorCredit = { role: publicAuthorCreditRole(c), name };
      if (c.personId) credit.personId = c.personId;
      return credit;
    })
    .filter((c): c is PublicStoryAuthorCredit => c != null);
}

function formatPublicAuthorCreditLine(c: ParsedStoryAuthor): string | null {
  const name = c.name?.trim();
  if (!name) return null;
  const role = publicAuthorCreditRole(c);
  if (!role) return name;
  return /\s$/.test(role) ? `${role}${name}` : `${role} ${name}`;
}

export function formatPublicAuthorLines(meta: StoryBodyMetaParsed, dbAuthorName: string | null | undefined): string[] {
  let credits = meta.authors;
  if (credits.length === 0) {
    const n = dbAuthorName?.trim();
    if (n) credits = [{ name: n, authorPrefixMode: "by" }];
  }
  return credits
    .map((c) => formatPublicAuthorCreditLine(c))
    .filter((line): line is string => line != null && line.length > 0);
}

/** Joined with newlines for hero layout (`whitespace-pre-line`). */
export function formatPublicAuthorLine(meta: StoryBodyMetaParsed, dbAuthorName: string | null | undefined): string | null {
  const lines = formatPublicAuthorLines(meta, dbAuthorName);
  if (lines.length === 0) return null;
  return lines.join("\n");
}
