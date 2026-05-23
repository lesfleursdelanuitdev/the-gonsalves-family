import { describe, expect, it } from "vitest";
import {
  ancestorChartHref,
  buildTreeViewerSearchParams,
  childDescendancyHref,
  familyTreeHref,
  normalizeTreeViewerGedcomXref,
  parseTreeViewerUrlParams,
  TREE_VIEWER_PATH,
  type TreeViewerUrlSyncInput,
} from "@/lib/treeViewerUrl";

// ── normalizeTreeViewerGedcomXref ─────────────────────────────────────────────

describe("normalizeTreeViewerGedcomXref", () => {
  it("returns null for null", () => {
    expect(normalizeTreeViewerGedcomXref(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(normalizeTreeViewerGedcomXref(undefined)).toBeNull();
  });

  it("returns null for non-string", () => {
    expect(normalizeTreeViewerGedcomXref(123 as unknown as string)).toBeNull();
  });

  it("wraps bare xref with @…@", () => {
    expect(normalizeTreeViewerGedcomXref("I1")).toBe("@I1@");
  });

  it("preserves already-wrapped xref", () => {
    expect(normalizeTreeViewerGedcomXref("@I1@")).toBe("@I1@");
  });

  it("removes extra leading/trailing @", () => {
    expect(normalizeTreeViewerGedcomXref("@@I1@@")).toBe("@I1@");
  });

  it("returns null for whitespace-only content after stripping @", () => {
    expect(normalizeTreeViewerGedcomXref("@  @")).toBeNull();
  });
});

// ── parseTreeViewerUrlParams ──────────────────────────────────────────────────

describe("parseTreeViewerUrlParams", () => {
  it("returns all nulls for empty input", () => {
    const result = parseTreeViewerUrlParams({});
    expect(result.initialUrlDepth).toBeNull();
    expect(result.initialPersonCardLayout).toBeNull();
    expect(result.initialPersonCardVariant).toBeNull();
    expect(result.initialCompactCardSize).toBeNull();
    expect(result.initialPartnersUrl).toBeNull();
    expect(result.initialRevealSpouseXref).toBeNull();
    expect(result.initialFamilyXref).toBeNull();
    expect(result.initialPedigreeFamcFamilyXref).toBeNull();
    expect(result.initialParentPairGap).toBeNull();
  });

  it("parses depth and clamps it between 1 and DEFAULT_MAX_DEPTH (6)", () => {
    expect(parseTreeViewerUrlParams({ depth: "3" }).initialUrlDepth).toBe(3);
    expect(parseTreeViewerUrlParams({ depth: "0" }).initialUrlDepth).toBe(1);
    expect(parseTreeViewerUrlParams({ depth: "99" }).initialUrlDepth).toBe(6);
  });

  it("ignores non-numeric depth", () => {
    expect(parseTreeViewerUrlParams({ depth: "abc" }).initialUrlDepth).toBeNull();
  });

  it("picks first value from array params", () => {
    expect(parseTreeViewerUrlParams({ depth: ["4", "2"] }).initialUrlDepth).toBe(4);
  });

  it("parses valid card layout", () => {
    expect(parseTreeViewerUrlParams({ card: "avatarTopActionsBottom" }).initialPersonCardLayout).toBe("avatarTopActionsBottom");
  });

  it("returns null for unknown card layout", () => {
    expect(parseTreeViewerUrlParams({ card: "unknown-layout" }).initialPersonCardLayout).toBeNull();
  });

  it("parses valid cardVariant", () => {
    expect(parseTreeViewerUrlParams({ cardVariant: "compact-name" }).initialPersonCardVariant).toBe("compact-name");
  });

  it("returns null for unknown cardVariant", () => {
    expect(parseTreeViewerUrlParams({ cardVariant: "giant" }).initialPersonCardVariant).toBeNull();
  });

  it("parses valid compact cardSize", () => {
    expect(parseTreeViewerUrlParams({ cardSize: "small" }).initialCompactCardSize).toBe("small");
  });

  it("parses partners open from multiple aliases", () => {
    expect(parseTreeViewerUrlParams({ partners: "open" }).initialPartnersUrl).toBe("open");
    expect(parseTreeViewerUrlParams({ partners: "all" }).initialPartnersUrl).toBe("open");
    expect(parseTreeViewerUrlParams({ partners: "1" }).initialPartnersUrl).toBe("open");
    expect(parseTreeViewerUrlParams({ partners: "true" }).initialPartnersUrl).toBe("open");
  });

  it("parses partners closed from multiple aliases", () => {
    expect(parseTreeViewerUrlParams({ partners: "closed" }).initialPartnersUrl).toBe("closed");
    expect(parseTreeViewerUrlParams({ partners: "0" }).initialPartnersUrl).toBe("closed");
    expect(parseTreeViewerUrlParams({ partners: "false" }).initialPartnersUrl).toBe("closed");
  });

  it("parses partners 'root'", () => {
    expect(parseTreeViewerUrlParams({ partners: "root" }).initialPartnersUrl).toBe("root");
  });

  it("suppresses partners when spouse xref is present (family-unit view)", () => {
    const result = parseTreeViewerUrlParams({ partners: "open", spouse: "@I2@" });
    expect(result.initialPartnersUrl).toBeNull();
    expect(result.initialRevealSpouseXref).toBe("@I2@");
  });

  it("normalizes famc xref without leading @", () => {
    const result = parseTreeViewerUrlParams({ famc: "F1" });
    expect(result.initialPedigreeFamcFamilyXref).toBe("@F1@");
  });

  it("preserves already-normalized famc xref", () => {
    const result = parseTreeViewerUrlParams({ famc: "@F1@" });
    expect(result.initialPedigreeFamcFamilyXref).toBe("@F1@");
  });

  it("returns null for empty famc", () => {
    expect(parseTreeViewerUrlParams({ famc: "" }).initialPedigreeFamcFamilyXref).toBeNull();
  });

  it("parses and clamps ppg (parent pair gap)", () => {
    expect(parseTreeViewerUrlParams({ ppg: "20" }).initialParentPairGap).toBe(20);
    expect(parseTreeViewerUrlParams({ ppg: "-5" }).initialParentPairGap).toBe(0);
    expect(parseTreeViewerUrlParams({ ppg: "999" }).initialParentPairGap).toBe(64);
  });
});

// ── familyTreeHref ────────────────────────────────────────────────────────────

describe("familyTreeHref", () => {
  it("builds a descendancy URL with chart and depth params", () => {
    const href = familyTreeHref({ rootXref: "@I1@" });
    const url = new URL(href, "http://localhost");
    expect(url.pathname).toBe(TREE_VIEWER_PATH);
    expect(url.searchParams.get("root")).toBe("@I1@");
    expect(url.searchParams.get("chart")).toBe("descendancy");
    expect(url.searchParams.get("depth")).toBe("1");
  });

  it("includes spouse when provided", () => {
    const href = familyTreeHref({ rootXref: "@I1@", spouseXref: "@I2@" });
    expect(new URL(href, "http://localhost").searchParams.get("spouse")).toBe("@I2@");
  });

  it("includes family xref when provided", () => {
    const href = familyTreeHref({ rootXref: "@I1@", familyXref: "@F1@" });
    expect(new URL(href, "http://localhost").searchParams.get("family")).toBe("@F1@");
  });

  it("returns bare path when rootXref is empty", () => {
    expect(familyTreeHref({ rootXref: "" })).toBe(TREE_VIEWER_PATH);
  });
});

// ── childDescendancyHref ──────────────────────────────────────────────────────

describe("childDescendancyHref", () => {
  it("builds URL with partners=root", () => {
    const href = childDescendancyHref({ rootXref: "@I5@" });
    const url = new URL(href, "http://localhost");
    expect(url.searchParams.get("root")).toBe("@I5@");
    expect(url.searchParams.get("partners")).toBe("root");
    expect(url.searchParams.get("chart")).toBe("descendancy");
  });

  it("returns bare path when rootXref is empty", () => {
    expect(childDescendancyHref({ rootXref: "" })).toBe(TREE_VIEWER_PATH);
  });
});

// ── ancestorChartHref ─────────────────────────────────────────────────────────

describe("ancestorChartHref", () => {
  it("builds pedigree URL", () => {
    const href = ancestorChartHref({ rootXref: "@I1@", chartStrategy: "pedigree" });
    const url = new URL(href, "http://localhost");
    expect(url.searchParams.get("chart")).toBe("pedigree");
    expect(url.searchParams.get("root")).toBe("@I1@");
  });

  it("includes famc xref when provided", () => {
    const href = ancestorChartHref({ rootXref: "@I1@", chartStrategy: "fan_chart", famcXref: "@F1@" });
    expect(new URL(href, "http://localhost").searchParams.get("famc")).toBe("@F1@");
  });

  it("returns bare path when rootXref is empty", () => {
    expect(ancestorChartHref({ rootXref: "", chartStrategy: "pedigree" })).toBe(TREE_VIEWER_PATH);
  });
});

// ── buildTreeViewerSearchParams ───────────────────────────────────────────────

function baseInput(overrides?: Partial<TreeViewerUrlSyncInput>): TreeViewerUrlSyncInput {
  return {
    rootId: "@I1@",
    chartStrategy: "descendancy",
    depth: 3,
    personCardLayout: "avatarTopActionsBottom",
    personCardVariant: "full",
    compactCardSize: "medium",
    parentPairGap: 20,
    partnersUrl: null,
    ...overrides,
  };
}

describe("buildTreeViewerSearchParams", () => {
  it("sets root, depth, card, cardVariant, cardSize params", () => {
    const params = buildTreeViewerSearchParams(baseInput(), new URLSearchParams());
    expect(params.get("root")).toBe("@I1@");
    expect(params.get("depth")).toBe("3");
    expect(params.get("card")).toBe("avatarTopActionsBottom");
    expect(params.get("cardVariant")).toBe("full");
    expect(params.get("cardSize")).toBe("medium");
  });

  it("omits 'chart' param for descendancy (default)", () => {
    const params = buildTreeViewerSearchParams(baseInput({ chartStrategy: "descendancy" }), new URLSearchParams());
    expect(params.has("chart")).toBe(false);
  });

  it("includes 'chart' param for non-descendancy strategies", () => {
    const params = buildTreeViewerSearchParams(baseInput({ chartStrategy: "pedigree" }), new URLSearchParams());
    expect(params.get("chart")).toBe("pedigree");
  });

  it("includes 'partners' param when set and no spouse xref", () => {
    const params = buildTreeViewerSearchParams(baseInput({ partnersUrl: "open" }), new URLSearchParams());
    expect(params.get("partners")).toBe("open");
  });

  it("includes spouse param in descendancy mode when revealSpouseXref is set", () => {
    const params = buildTreeViewerSearchParams(
      baseInput({ revealSpouseXref: "@I2@" }),
      new URLSearchParams()
    );
    expect(params.get("spouse")).toBe("@I2@");
    expect(params.has("partners")).toBe(false);
  });

  it("clamps depth to [1, DEFAULT_MAX_DEPTH]", () => {
    expect(buildTreeViewerSearchParams(baseInput({ depth: 0 }), new URLSearchParams()).get("depth")).toBe("1");
    expect(buildTreeViewerSearchParams(baseInput({ depth: 99 }), new URLSearchParams()).get("depth")).toBe("6");
  });

  it("preserves 'rootName' and 'loadSavedHistory' from existing params", () => {
    const existing = new URLSearchParams("rootName=Alice&loadSavedHistory=1");
    const params = buildTreeViewerSearchParams(baseInput(), existing);
    expect(params.get("rootName")).toBe("Alice");
    expect(params.get("loadSavedHistory")).toBe("1");
  });

  it("sets famc param for pedigree strategy when pedigreeFamcFamilyXref is set", () => {
    const params = buildTreeViewerSearchParams(
      baseInput({ chartStrategy: "pedigree", pedigreeFamcFamilyXref: "@F1@" }),
      new URLSearchParams()
    );
    expect(params.get("famc")).toBe("@F1@");
  });

  it("sets ppg param for pedigree and vertical_pedigree strategies", () => {
    expect(
      buildTreeViewerSearchParams(baseInput({ chartStrategy: "pedigree", parentPairGap: 32 }), new URLSearchParams()).get("ppg")
    ).toBe("32");
    expect(
      buildTreeViewerSearchParams(baseInput({ chartStrategy: "vertical_pedigree", parentPairGap: 16 }), new URLSearchParams()).get("ppg")
    ).toBe("16");
  });

  it("does not set ppg param for fan_chart strategy", () => {
    const params = buildTreeViewerSearchParams(
      baseInput({ chartStrategy: "fan_chart", parentPairGap: 20 }),
      new URLSearchParams()
    );
    expect(params.has("ppg")).toBe(false);
  });
});
