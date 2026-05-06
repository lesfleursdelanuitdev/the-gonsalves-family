import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { DEFAULT_MAX_DEPTH } from "@/genealogy-visualization-engine";
import type { PersonCardLayout } from "@/lib/person-card-layout";
import { PERSON_CARD_LAYOUT_OPTIONS } from "@/lib/person-card-layout";

const CARD_VALUES = new Set(PERSON_CARD_LAYOUT_OPTIONS.map((o) => o.value));

export type TreeViewerPartnersUrl = "open" | "closed";

export type ParsedTreeViewerUrl = {
  initialUrlDepth: number | null;
  initialPersonCardLayout: PersonCardLayout | null;
  /** `null` = omit from URL / do not override partners from history. */
  initialPartnersUrl: TreeViewerPartnersUrl | null;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function parseTreeViewerUrlParams(raw: {
  depth?: string | string[];
  card?: string | string[];
  partners?: string | string[];
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

  return { initialUrlDepth, initialPersonCardLayout, initialPartnersUrl };
}

export type TreeViewerUrlSyncInput = {
  rootId: string;
  chartStrategy: ChartViewStrategyName;
  depth: number;
  personCardLayout: PersonCardLayout;
  partnersUrl: TreeViewerPartnersUrl | null;
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
  if (input.chartStrategy === "descendancy" && input.partnersUrl != null) {
    next.set("partners", input.partnersUrl);
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
