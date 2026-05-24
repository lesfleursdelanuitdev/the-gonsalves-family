export type P = unknown[];

export function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
export function pct(s: string): string { return `%${esc(s)}%`; }
export function qp(p: P, v: unknown): string { p.push(v); return `$${p.length}`; }

/** Build a match condition for a single column and single term. */
export function mc(p: P, col: string, term: string, mt: string): string {
  if (mt === "exact")   return `LOWER(${col}) = ${qp(p, term.toLowerCase())}`;
  if (mt === "soundex") return `left(soundex(${col}), 3) = left(soundex(${qp(p, term)}), 3)`;
  return `${col} ILIKE ${qp(p, pct(term.toLowerCase()))}`;
}

/** Parse comma-separated query string into individual trimmed terms. */
export function parseTerms(q: string): string[] {
  return q.split(",").map(t => t.trim()).filter(t => t.length > 0);
}

/**
 * Build a WHERE condition for multiple terms across multiple columns.
 * OR logic: any term matches any column.
 * AND logic: every term matches at least one column.
 */
export function termsBlock(p: P, cols: string[], terms: string[], mt: string, logic: "or" | "and"): string {
  const termConds = terms.map(t => {
    const colConds = cols.map(col => mc(p, col, t, mt));
    return colConds.length === 1 ? colConds[0]! : `(${colConds.join(" OR ")})`;
  });
  if (termConds.length === 1) return termConds[0]!;
  return `(${termConds.join(logic === "and" ? " AND " : " OR ")})`;
}
