import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { DEFAULT_MAX_DEPTH } from "@/genealogy-visualization-engine";
import type {
  PersonCardLayout,
  PersonCardVariant,
  PersonCompactCardSize,
} from "@/lib/person-card-layout";
import { PERSON_CARD_LAYOUT_OPTIONS } from "@/lib/person-card-layout";

const CARD_VALUES = new Set(PERSON_CARD_LAYOUT_OPTIONS.map((o) => o.value));
const CARD_VARIANT_VALUES = new Set<PersonCardVariant>(["full", "compact-name", "compact-avatar"]);
const COMPACT_SIZE_VALUES = new Set<PersonCompactCardSize>(["large", "medium", "small", "extra-small"]);
const PARENT_PAIR_GAP_MIN = 0;
const PARENT_PAIR_GAP_MAX = 64;

export type TreeViewerPartnersUrl = "open" | "closed" | "root";

/** Descendancy depth for family profile links (root + direct children only). */
export const FAMILY_UNIT_TREE_DEPTH = 1;

/** Same depth as family unit: child + all root partners + direct children (catch-all allowed). */
export const CHILD_DESCENDANCY_DEPTH = FAMILY_UNIT_TREE_DEPTH;

export type ParsedTreeViewerUrl = {
  initialUrlDepth: number | null;
  initialPersonCardLayout: PersonCardLayout | null;
  initialPersonCardVariant: PersonCardVariant | null;
  initialCompactCardSize: PersonCompactCardSize | null;
  /** `null` = omit from URL / do not override partners from history. */
  initialPartnersUrl: TreeViewerPartnersUrl | null;
  /** Descendancy: `spouse` query — reveal this partner xref for `root` (family unit view). */
  initialRevealSpouseXref: string | null;
  /** Descendancy: `family` query — originating family xref (`@F…@`) for family profile links. */
  initialFamilyXref: string | null;
  /** Ancestor charts (pedigree / vertical pedigree / fan): `famc` query — family xref (`@F…@`). */
  initialPedigreeFamcFamilyXref: string | null;
  /** Ancestor charts (`pedigree` / `vertical_pedigree`): parent pair spacing (px). */
  initialParentPairGap: number | null;
};

export function normalizeTreeViewerGedcomXref(xref: string | null | undefined): string | null {
  if (xref == null || typeof xref !== "string") return null;
  const inner = xref.replace(/^@+|@+$/g, "").trim();
  if (inner === "") return null;
  return `@${inner}@`;
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function parseTreeViewerUrlParams(raw: {
  depth?: string | string[];
  card?: string | string[];
  cardVariant?: string | string[];
  cardSize?: string | string[];
  partners?: string | string[];
  spouse?: string | string[];
  family?: string | string[];
  famc?: string | string[];
  ppg?: string | string[];
}): ParsedTreeViewerUrl {
  const depthRaw = firstParam(raw.depth)?.trim();
  let initialUrlDepth: number | null = null;
  if (depthRaw) {
    const n = parseInt(depthRaw, 10);
    if (Number.isFinite(n)) {
      initialUrlDepth = Math.min(Math.max(n, 1), DEFAULT_MAX_DEPTH);
    }
  }

  const cardRaw = firstParam(raw.card)?.trim();
  const initialPersonCardLayout =
    cardRaw && CARD_VALUES.has(cardRaw as PersonCardLayout)
      ? (cardRaw as PersonCardLayout)
      : null;

  const cardVariantRaw = firstParam(raw.cardVariant)?.trim();
  const initialPersonCardVariant =
    cardVariantRaw && CARD_VARIANT_VALUES.has(cardVariantRaw as PersonCardVariant)
      ? (cardVariantRaw as PersonCardVariant)
      : null;

  const cardSizeRaw = firstParam(raw.cardSize)?.trim();
  const initialCompactCardSize =
    cardSizeRaw && COMPACT_SIZE_VALUES.has(cardSizeRaw as PersonCompactCardSize)
      ? (cardSizeRaw as PersonCompactCardSize)
      : null;

  const initialRevealSpouseXref = normalizeTreeViewerGedcomXref(firstParam(raw.spouse));
  const initialFamilyXref = normalizeTreeViewerGedcomXref(firstParam(raw.family));

  const partnersRaw = firstParam(raw.partners)?.trim().toLowerCase();
  let initialPartnersUrl: TreeViewerPartnersUrl | null = null;
  if (initialRevealSpouseXref == null) {
    if (partnersRaw === "open" || partnersRaw === "all" || partnersRaw === "1" || partnersRaw === "true") {
      initialPartnersUrl = "open";
    } else if (partnersRaw === "root") {
      initialPartnersUrl = "root";
    } else if (
      partnersRaw === "closed" ||
      partnersRaw === "0" ||
      partnersRaw === "false"
    ) {
      initialPartnersUrl = "closed";
    }
  }

  const famcRaw = firstParam(raw.famc)?.trim() ?? "";
  const initialPedigreeFamcFamilyXref =
    famcRaw === "" ? null : famcRaw.startsWith("@") ? famcRaw : `@${famcRaw.replace(/@/g, "")}@`;

  const ppgRaw = firstParam(raw.ppg)?.trim();
  let initialParentPairGap: number | null = null;
  if (ppgRaw) {
    const n = parseInt(ppgRaw, 10);
    if (Number.isFinite(n)) {
      initialParentPairGap = Math.min(PARENT_PAIR_GAP_MAX, Math.max(PARENT_PAIR_GAP_MIN, n));
    }
  }

  return {
    initialUrlDepth,
    initialPersonCardLayout,
    initialPersonCardVariant,
    initialCompactCardSize,
    initialPartnersUrl,
    initialRevealSpouseXref,
    initialFamilyXref,
    initialPedigreeFamcFamilyXref,
    initialParentPairGap,
  };
}

export const TREE_VIEWER_PATH = "/tree/viewer";

/**
 * Descendancy deep link for a family profile: root at one partner, reveal the other, children only.
 */
/** Family card / profile: descendancy at first partner, second partner revealed, this family's children only. */
export function publicFamilyTreeHref(family: {
  xref: string;
  title: string;
  partners: ReadonlyArray<{ xref: string }>;
}): string | null {
  const rootPartner = family.partners[0];
  if (!rootPartner) return null;
  return familyTreeHref({
    rootXref: rootPartner.xref,
    spouseXref: family.partners[1]?.xref,
    familyXref: family.xref,
    rootName: family.title,
  });
}

export function familyTreeHref(args: {
  rootXref: string;
  spouseXref?: string | null;
  familyXref?: string | null;
  rootName?: string | null;
}): string {
  const root = normalizeTreeViewerGedcomXref(args.rootXref);
  if (!root) return TREE_VIEWER_PATH;

  const params = new URLSearchParams({
    root,
    chart: "descendancy",
    depth: String(FAMILY_UNIT_TREE_DEPTH),
  });
  const spouse = normalizeTreeViewerGedcomXref(args.spouseXref);
  if (spouse) params.set("spouse", spouse);
  const family = normalizeTreeViewerGedcomXref(args.familyXref);
  if (family) params.set("family", family);
  const name = args.rootName?.trim();
  if (name) params.set("rootName", name);

  return `${TREE_VIEWER_PATH}?${params.toString()}`;
}

/**
 * Descendancy deep link for a family-profile child: root at C, all of C’s partners revealed, depth 1.
 * Catch-all may still appear for children with an unknown/other parent.
 */
export function childDescendancyHref(args: {
  rootXref: string;
  rootName?: string | null;
}): string {
  const root = normalizeTreeViewerGedcomXref(args.rootXref);
  if (!root) return TREE_VIEWER_PATH;

  const params = new URLSearchParams({
    root,
    chart: "descendancy",
    depth: String(CHILD_DESCENDANCY_DEPTH),
    partners: "root",
  });
  const name = args.rootName?.trim();
  if (name) params.set("rootName", name);

  return `${TREE_VIEWER_PATH}?${params.toString()}`;
}

export type AncestorChartStrategy = Extract<
  ChartViewStrategyName,
  "pedigree" | "vertical_pedigree" | "fan_chart"
>;

/** Open tree viewer with `root` as proband in an ancestor chart (pedigree, vertical pedigree, or fan). */
export function ancestorChartHref(args: {
  rootXref: string;
  chartStrategy: AncestorChartStrategy;
  rootName?: string | null;
  famcXref?: string | null;
}): string {
  const root = normalizeTreeViewerGedcomXref(args.rootXref);
  if (!root) return TREE_VIEWER_PATH;

  const params = new URLSearchParams({
    root,
    chart: args.chartStrategy,
  });
  const name = args.rootName?.trim();
  if (name) params.set("rootName", name);
  const famc = normalizeTreeViewerGedcomXref(args.famcXref);
  if (famc) params.set("famc", famc);

  return `${TREE_VIEWER_PATH}?${params.toString()}`;
}

export type TreeViewerUrlSyncInput = {
  rootId: string;
  chartStrategy: ChartViewStrategyName;
  depth: number;
  personCardLayout: PersonCardLayout;
  personCardVariant: PersonCardVariant;
  compactCardSize: PersonCompactCardSize;
  parentPairGap: number;
  partnersUrl: TreeViewerPartnersUrl | null;
  /** When set, written as `spouse` (family unit view; suppresses `partners`). */
  revealSpouseXref?: string | null;
  /** When set, written as `family` (family profile context). */
  familyXref?: string | null;
  /** When set (ancestor-chart modes), written as `famc` query. */
  pedigreeFamcFamilyXref?: string | null;
};

/** Preserves unrelated query keys (e.g. loadSavedHistory, rootName). */
export function buildTreeViewerSearchParams(
  input: TreeViewerUrlSyncInput,
  existing: URLSearchParams
): URLSearchParams {
  const next = new URLSearchParams();
  const preserve = ["loadSavedHistory", "rootName", "spouse", "family"];
  for (const k of preserve) {
    const v = existing.get(k);
    if (v != null && v !== "") next.set(k, v);
  }
  next.set("root", input.rootId);
  if (input.chartStrategy !== "descendancy") {
    next.set("chart", input.chartStrategy);
  }
  const depth = Math.min(Math.max(Math.round(input.depth), 1), DEFAULT_MAX_DEPTH);
  next.set("depth", String(depth));
  next.set("card", input.personCardLayout);
  next.set("cardVariant", input.personCardVariant);
  next.set("cardSize", input.compactCardSize);
  const spouseXref = normalizeTreeViewerGedcomXref(input.revealSpouseXref ?? existing.get("spouse"));
  const familyXref = normalizeTreeViewerGedcomXref(input.familyXref ?? existing.get("family"));
  if (input.chartStrategy === "descendancy") {
    if (spouseXref) {
      next.set("spouse", spouseXref);
      if (familyXref) next.set("family", familyXref);
    } else if (input.partnersUrl != null) {
      next.set("partners", input.partnersUrl);
    }
  }
  if (
    (input.chartStrategy === "pedigree" ||
      input.chartStrategy === "vertical_pedigree" ||
      input.chartStrategy === "fan_chart") &&
    input.pedigreeFamcFamilyXref != null &&
    input.pedigreeFamcFamilyXref.trim() !== ""
  ) {
    next.set("famc", input.pedigreeFamcFamilyXref.trim());
  }
  if (input.chartStrategy === "pedigree" || input.chartStrategy === "vertical_pedigree") {
    const gap = Math.min(PARENT_PAIR_GAP_MAX, Math.max(PARENT_PAIR_GAP_MIN, Math.round(input.parentPairGap)));
    next.set("ppg", String(gap));
  }
  return next;
}

export function treeViewerSearchParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  const keys = new Set<string>([...a.keys(), ...b.keys()]);
  for (const k of keys) {
    if (a.get(k) !== b.get(k)) return false;
  }
  return true;
}
