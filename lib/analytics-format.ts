// Shared display formatting for analytics / NL-search results.
//
// Two entry points:
//   - humanizeKey(key)          → for column headers, summary keys, the intent header.
//   - formatValue(columnKey, v) → column-aware value formatting.
//
// Design: format by COLUMN, never by blindly transforming every value. The analytics
// handlers emit mostly verbatim data (ids, xrefs, place/date display strings, free text)
// that must NOT be mangled. Only a small, known set of coded columns is mapped; unknown
// columns fall back to humanizing the value ONLY when it is unambiguously a multi-token
// snake_case identifier.

import { formatGedcomFullNameForDisplay, formatGender } from "@/lib/individual-mapper";
import { gedcomEventTypeDisplayLabel } from "@/lib/gedcom-event-display";

/** Tokens that should read as all-caps rather than Title-cased. */
const ACRONYMS = new Set(["id", "lca", "dag", "url", "uuid", "dna"]);

/** A value is only auto-humanized when it looks like `a_b[_c…]` (lowercase, ≥1 underscore). */
const SNAKE_MULTI_TOKEN = /^[a-z0-9]+(?:_[a-z0-9]+)+$/;

function titleizeToken(token: string): string {
  if (!token) return token;
  if (ACRONYMS.has(token.toLowerCase())) return token.toUpperCase();
  return token.charAt(0).toUpperCase() + token.slice(1);
}

/** "birth_place_display" → "Birth Place Display"; "top_given_names" → "Top Given Names". */
export function humanizeKey(key: string): string {
  const k = (key ?? "").trim();
  if (!k) return "";
  return k
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(titleizeToken)
    .join(" ");
}

// ── Coded-enum value maps (the only value spaces the handlers emit raw) ──────────

const FACET_LABELS: Record<string, string> = {
  birth: "Birth",
  death: "Death",
  both: "Birth & death",
  burial: "Burial",
};

const DEGREE_LABELS: Record<string, string> = {
  first: "First",
  second: "Second",
  third: "Third",
  fourth: "Fourth",
  fifth: "Fifth",
};

const RELATIONSHIP_CATEGORY_LABELS: Record<string, string> = {
  source_is_ancestor_of_target: "Source is an ancestor of target",
  target_is_ancestor_of_source: "Target is an ancestor of source",
  collateral: "Collateral relatives",
  unrelated_pedigree_links: "Unrelated (pedigree links only)",
  same_individual: "Same individual",
};

/** Columns whose values are ids / codes / free text / pre-formatted strings — never transformed. */
const VERBATIM_COLUMNS = new Set([
  "id",
  "xref",
  "anchor_id",
  "source_id",
  "target_id",
  "lowest_common_ancestor_id",
  "soundex",
  "metaphone",
  "file_ref",
  "form",
  "snippet",
  "name",
  "occupation",
  "cause",
  "country",
  "title",
  "author",
  "abbreviation",
  "publication",
]);

/**
 * Format a single cell/value given the column it belongs to.
 * `columnKey` is the raw snake_case key from the result row.
 */
export function formatValue(columnKey: string, value: unknown): string {
  if (value === null || value === undefined) return "—";

  const key = (columnKey ?? "").toLowerCase();

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "number") {
    if (key === "decade") return `${value}–${value + 9}`;
    return String(value);
  }

  if (typeof value === "object") return JSON.stringify(value);

  const str = String(value);

  // Names (may carry GEDCOM surname slashes).
  if (key === "full_name") return formatGedcomFullNameForDisplay(str) || str;

  // Coded enums.
  if (key === "sex") return formatGender(str, null) ?? str;
  if (key === "event_type") return gedcomEventTypeDisplayLabel(str);
  if (key === "facet") return FACET_LABELS[str.toLowerCase()] ?? humanizeKey(str);
  if (key === "category") return RELATIONSHIP_CATEGORY_LABELS[str.toLowerCase()] ?? humanizeKey(str);
  if (key === "degree") return DEGREE_LABELS[str.toLowerCase()] ?? humanizeKey(str);

  // Verbatim: ids, cross-refs, and backend-formatted display strings.
  if (VERBATIM_COLUMNS.has(key) || key.endsWith("_display") || key.endsWith("_xref") || key.endsWith("_id")) {
    return str;
  }

  // Unknown column: only humanize values that are clearly snake_case identifiers
  // (e.g. relationship categories, intent names); leave everything else verbatim.
  return SNAKE_MULTI_TOKEN.test(str) ? humanizeKey(str) : str;
}
