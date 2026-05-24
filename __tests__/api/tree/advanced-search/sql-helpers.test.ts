import { describe, it, expect } from "vitest";
import { esc, pct, qp, mc, parseTerms, termsBlock, type P } from "@/app/api/tree/advanced-search/general/sql-helpers";

// ---------------------------------------------------------------------------
// esc
// ---------------------------------------------------------------------------
describe("esc", () => {
  it("leaves plain strings unchanged", () => {
    expect(esc("Smith")).toBe("Smith");
  });

  it("escapes backslashes", () => {
    expect(esc("a\\b")).toBe("a\\\\b");
  });

  it("escapes percent signs", () => {
    expect(esc("100%")).toBe("100\\%");
  });

  it("escapes underscores", () => {
    expect(esc("a_b")).toBe("a\\_b");
  });

  it("escapes all three special chars in one string", () => {
    expect(esc("a%b_c\\d")).toBe("a\\%b\\_c\\\\d");
  });
});

// ---------------------------------------------------------------------------
// pct
// ---------------------------------------------------------------------------
describe("pct", () => {
  it("wraps a plain term with % wildcards", () => {
    expect(pct("Smith")).toBe("%Smith%");
  });

  it("escapes special chars before wrapping", () => {
    expect(pct("100%")).toBe("%100\\%%");
  });
});

// ---------------------------------------------------------------------------
// qp
// ---------------------------------------------------------------------------
describe("qp", () => {
  it("appends value to params and returns $1 for the first call", () => {
    const p: P = [];
    expect(qp(p, "hello")).toBe("$1");
    expect(p).toEqual(["hello"]);
  });

  it("returns incrementing placeholders for successive calls", () => {
    const p: P = [];
    expect(qp(p, "a")).toBe("$1");
    expect(qp(p, "b")).toBe("$2");
    expect(qp(p, 42)).toBe("$3");
    expect(p).toEqual(["a", "b", 42]);
  });

  it("continues from the current array length when p is pre-populated", () => {
    const p: P = ["existing"];
    expect(qp(p, "new")).toBe("$2");
    expect(p).toEqual(["existing", "new"]);
  });
});

// ---------------------------------------------------------------------------
// mc
// ---------------------------------------------------------------------------
describe("mc", () => {
  it("contains: generates ILIKE with wildcard pattern", () => {
    const p: P = [];
    const cond = mc(p, "full_name_lower", "smith", "contains");
    expect(cond).toMatch(/ILIKE/);
    expect(cond).toMatch(/\$1/);
    expect(p[0]).toBe("%smith%");
  });

  it("contains: lowercases the term before pattern", () => {
    const p: P = [];
    mc(p, "full_name_lower", "SMITH", "contains");
    expect(p[0]).toBe("%smith%");
  });

  it("exact: generates LOWER(col) = $n", () => {
    const p: P = [];
    const cond = mc(p, "full_name_lower", "Smith", "exact");
    expect(cond).toBe("LOWER(full_name_lower) = $1");
    expect(p[0]).toBe("smith");
  });

  it("soundex: generates left(soundex(...)) comparison", () => {
    const p: P = [];
    const cond = mc(p, "full_name_lower", "Smith", "soundex");
    expect(cond).toMatch(/soundex/);
    expect(cond).toMatch(/\$1/);
    expect(p[0]).toBe("Smith");
  });

  it("unknown match type falls back to ILIKE", () => {
    const p: P = [];
    const cond = mc(p, "col", "x", "unknown");
    expect(cond).toMatch(/ILIKE/);
  });

  it("appends params in order across multiple calls", () => {
    const p: P = ["$seed"];
    mc(p, "col_a", "foo", "contains");
    mc(p, "col_b", "bar", "exact");
    expect(p[1]).toBe("%foo%");
    expect(p[2]).toBe("bar");
  });
});

// ---------------------------------------------------------------------------
// parseTerms
// ---------------------------------------------------------------------------
describe("parseTerms", () => {
  it("returns a single term for a plain query", () => {
    expect(parseTerms("Smith")).toEqual(["Smith"]);
  });

  it("splits on commas and trims whitespace", () => {
    expect(parseTerms("Smith, Jones")).toEqual(["Smith", "Jones"]);
  });

  it("handles extra whitespace around commas", () => {
    expect(parseTerms("  Cork  ,  Ireland  ")).toEqual(["Cork", "Ireland"]);
  });

  it("drops empty segments from consecutive commas", () => {
    expect(parseTerms("a,,b")).toEqual(["a", "b"]);
  });

  it("drops segments that are only whitespace", () => {
    expect(parseTerms("a ,  , b")).toEqual(["a", "b"]);
  });

  it("returns empty array for a blank string", () => {
    expect(parseTerms("")).toEqual([]);
  });

  it("returns empty array for only commas and whitespace", () => {
    expect(parseTerms(" , , ")).toEqual([]);
  });

  it("preserves three or more terms", () => {
    expect(parseTerms("Cork, County Cork, Ireland")).toEqual(["Cork", "County Cork", "Ireland"]);
  });
});

// ---------------------------------------------------------------------------
// termsBlock
// ---------------------------------------------------------------------------
describe("termsBlock", () => {
  // helper: capture the generated SQL and params together
  function build(
    cols: string[],
    terms: string[],
    logic: "or" | "and",
    mt = "contains",
  ): { sql: string; params: unknown[] } {
    const p: P = [];
    const sql = termsBlock(p, cols, terms, mt, logic);
    return { sql, params: p };
  }

  describe("single term, single column", () => {
    it("returns a bare ILIKE condition without extra parens", () => {
      const { sql, params } = build(["full_name_lower"], ["smith"], "or");
      expect(sql).toBe("full_name_lower ILIKE $1");
      expect(params).toEqual(["%smith%"]);
    });
  });

  describe("single term, multiple columns", () => {
    it("ORs the columns together in parens", () => {
      const { sql, params } = build(["col_a", "col_b"], ["smith"], "or");
      expect(sql).toBe("(col_a ILIKE $1 OR col_b ILIKE $2)");
      expect(params).toEqual(["%smith%", "%smith%"]);
    });

    it("same result for AND logic (only one term, so logic is irrelevant)", () => {
      const orResult  = build(["col_a", "col_b"], ["smith"], "or");
      const andResult = build(["col_a", "col_b"], ["smith"], "and");
      expect(andResult.sql).toBe(orResult.sql);
    });
  });

  describe("multiple terms, single column — OR logic", () => {
    it("joins term conditions with OR", () => {
      const { sql, params } = build(["full_name_lower"], ["smith", "jones"], "or");
      expect(sql).toBe("(full_name_lower ILIKE $1 OR full_name_lower ILIKE $2)");
      expect(params).toEqual(["%smith%", "%jones%"]);
    });
  });

  describe("multiple terms, single column — AND logic", () => {
    it("joins term conditions with AND", () => {
      const { sql, params } = build(["content"], ["smith", "ireland"], "and");
      expect(sql).toBe("(content ILIKE $1 AND content ILIKE $2)");
      expect(params).toEqual(["%smith%", "%ireland%"]);
    });
  });

  describe("multiple terms, multiple columns — OR logic", () => {
    it("each term OR'd across cols, then term blocks OR'd together", () => {
      const { sql, params } = build(["col_a", "col_b"], ["smith", "jones"], "or");
      // Each term block: (col_a ILIKE $n OR col_b ILIKE $n+1)
      // Combined with OR: ((block1) OR (block2))
      expect(sql).toBe("((col_a ILIKE $1 OR col_b ILIKE $2) OR (col_a ILIKE $3 OR col_b ILIKE $4))");
      expect(params).toEqual(["%smith%", "%smith%", "%jones%", "%jones%"]);
    });
  });

  describe("multiple terms, multiple columns — AND logic", () => {
    it("each term OR'd across cols, then term blocks AND'd together", () => {
      const { sql, params } = build(["col_a", "col_b"], ["smith", "ireland"], "and");
      // "smith appears in col_a OR col_b" AND "ireland appears in col_a OR col_b"
      expect(sql).toBe("((col_a ILIKE $1 OR col_b ILIKE $2) AND (col_a ILIKE $3 OR col_b ILIKE $4))");
      expect(params).toEqual(["%smith%", "%smith%", "%ireland%", "%ireland%"]);
    });
  });

  describe("exact match type", () => {
    it("generates LOWER(col) = $n for exact terms", () => {
      const { sql, params } = build(["full_name_lower"], ["Smith", "Jones"], "or", "exact");
      expect(sql).toBe("(LOWER(full_name_lower) = $1 OR LOWER(full_name_lower) = $2)");
      expect(params).toEqual(["smith", "jones"]);
    });
  });

  describe("param numbering is continuous", () => {
    it("param indices continue from wherever the shared p array is", () => {
      const p: P = ["seed1", "seed2"]; // pre-populated with 2 items
      const sql = termsBlock(p, ["col"], ["foo", "bar"], "contains", "or");
      // First term → $3, second → $4
      expect(sql).toBe("(col ILIKE $3 OR col ILIKE $4)");
      expect(p).toEqual(["seed1", "seed2", "%foo%", "%bar%"]);
    });
  });
});
