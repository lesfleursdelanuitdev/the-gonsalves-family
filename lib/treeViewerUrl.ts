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
const PARENT_PAIR_GAP_MIN = 4;
const PARENT_PAIR_GAP_MAX = 64;

export type TreeViewerPartnersUrl = "open" | "closed";

export type ParsedTreeViewerUrl = {
  initialUrlDepth: number | null;
  initialPersonCardLayout: PersonCardLayout | null;
  initialPersonCardVariant: PersonCardVariant | null;
  initialCompactCardSize: PersonCompactCardSize | null;
  /** `null` = omit from URL / do not override partners from history. */
  initialPartnersUrl: TreeViewerPartnersUrl | null;
  /** Ancestor charts (pedigree / vertical pedigree / fan): `famc` query — family xref (`@F…@`). */
  initialPedigreeFamcFamilyXref: string | null;
  /** Ancestor charts (`pedigree` / `vertical_pedigree`): parent pair spacing (px). */
  initialParentPairGap: number | null;
};

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

  const partnersRaw = firstParam(raw.partners)?.trim().toLowerCase();
  let initialPartnersUrl: TreeViewerPartnersUrl | null = null;
  if (partnersRaw === "open" || partnersRaw === "all" || partnersRaw === "1" || partnersRaw === "true") {
    initialPartnersUrl = "open";
  } else if (
    partnersRaw === "closed" ||
    partnersRaw === "0" ||
    partnersRaw === "false"
  ) {
    initialPartnersUrl = "closed";
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
    initialPedigreeFamcFamilyXref,
    initialParentPairGap,
  };
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
  /** When set (ancestor-chart modes), written as `famc` query. */
  pedigreeFamcFamilyXref?: string | null;
};

/** Preserves unrelated query keys (e.g. loadSavedHistory, rootName). */
export function buildTreeViewerSearchParams(
  input: TreeViewerUrlSyncInput,
  existing: URLSearchParams
): URLSearchParams {
  const next = new URLSearchParams();
  const preserve = ["loadSavedHistory", "rootName"];
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
  if (input.chartStrategy === "descendancy" && input.partnersUrl != null) {
    next.set("partners", input.partnersUrl);
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
