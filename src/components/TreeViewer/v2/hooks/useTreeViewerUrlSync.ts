"use client";

import { useEffect, useRef } from "react";
import {
  getSpousesOf,
  isAllSpousesRevealed,
  type ChartViewStrategyName,
  type TreeAction,
  type ViewState,
} from "@/genealogy-visualization-engine";
import type { PersonCardLayout, PersonCardVariant, PersonCompactCardSize } from "@/lib/person-card-layout";
import type { TreeViewerPartnersUrl } from "@/lib/treeViewerUrl";
import {
  buildTreeViewerSearchParams,
  normalizeTreeViewerGedcomXref,
  treeViewerSearchParamsEqual,
} from "@/lib/treeViewerUrl";

function isRootAllPartnersRevealed(
  revealedUnions: ViewState["revealedUnions"],
  rootId: string
): boolean {
  const rootNorm = normalizeTreeViewerGedcomXref(rootId) ?? rootId;
  const spouseEntries = getSpousesOf(rootNorm);
  if (spouseEntries.length === 0) return false;
  const revealed = new Set(revealedUnions?.get(rootNorm) ?? []);
  return spouseEntries.every(({ spouseId }) => revealed.has(spouseId));
}

export interface UseTreeViewerUrlSyncParams {
  rootId: string;
  chartStrategy: ChartViewStrategyName;
  isAncestorChart: boolean;
  effectiveCurrentDepth: number;
  personCardLayout: PersonCardLayout;
  personCardVariant: PersonCardVariant;
  compactCardSize: PersonCompactCardSize;
  parentPairGap: number;
  pedigreeFamcFamilyXref: string | null | undefined;
  revealedUnions: ViewState["revealedUnions"];
  initialPartnersUrl: TreeViewerPartnersUrl | null;
  /** When set, reveal only this spouse for `rootId` on load (family unit view). */
  initialRevealSpouseXref: string | null;
  initialFamilyXref: string | null;
  familyUnitScope: ViewState["familyUnitScope"];
  chartAdapter: unknown;
  isChartLoading: boolean;
  /** Increments when chart payload is ready; used to apply URL spouse reveal after fetch. */
  chartDataKey: number;
  dispatch: (action: TreeAction) => void;
}

export function useTreeViewerUrlSync({
  rootId,
  chartStrategy,
  isAncestorChart,
  effectiveCurrentDepth,
  personCardLayout,
  personCardVariant,
  compactCardSize,
  parentPairGap,
  pedigreeFamcFamilyXref,
  revealedUnions,
  initialPartnersUrl,
  initialRevealSpouseXref,
  initialFamilyXref,
  familyUnitScope,
  chartAdapter,
  isChartLoading,
  chartDataKey,
  dispatch,
}: UseTreeViewerUrlSyncParams) {
  const appliedUrlPartnersRef = useRef(false);
  const appliedUrlSpouseRef = useRef(false);
  const lastSpouseApplyChartKeyRef = useRef(0);
  const lastRootPartnersApplyChartKeyRef = useRef(0);

  useEffect(() => {
    appliedUrlPartnersRef.current = false;
    appliedUrlSpouseRef.current = false;
    lastSpouseApplyChartKeyRef.current = 0;
    lastRootPartnersApplyChartKeyRef.current = 0;
  }, [initialPartnersUrl, initialRevealSpouseXref, initialFamilyXref, rootId]);

  useEffect(() => {
    if (initialRevealSpouseXref == null) return;
    if (chartStrategy !== "descendancy") return;
    if (!chartAdapter || isChartLoading) return;
    if (chartDataKey === 0) return;
    if (lastSpouseApplyChartKeyRef.current === chartDataKey) return;
    if (!rootId.trim()) return;
    lastSpouseApplyChartKeyRef.current = chartDataKey;
    appliedUrlSpouseRef.current = true;
    const personId = normalizeTreeViewerGedcomXref(rootId) ?? rootId;
    const spouseId = normalizeTreeViewerGedcomXref(initialRevealSpouseXref) ?? initialRevealSpouseXref;
    const familyXref = normalizeTreeViewerGedcomXref(initialFamilyXref);
    if (familyXref) {
      dispatch({
        type: "SET_FAMILY_UNIT_SCOPE",
        personId,
        spouseId,
        familyXref,
      });
      return;
    }
    dispatch({
      type: "REVEAL_SPOUSE",
      personId,
      spouseId,
    });
  }, [
    initialRevealSpouseXref,
    initialFamilyXref,
    chartStrategy,
    chartAdapter,
    isChartLoading,
    chartDataKey,
    dispatch,
    rootId,
  ]);

  useEffect(() => {
    if (initialRevealSpouseXref != null) return;
    if (initialPartnersUrl !== "root") return;
    if (chartStrategy !== "descendancy") return;
    if (!chartAdapter || isChartLoading) return;
    if (chartDataKey === 0) return;
    if (lastRootPartnersApplyChartKeyRef.current === chartDataKey) return;
    if (!rootId.trim()) return;
    lastRootPartnersApplyChartKeyRef.current = chartDataKey;
    appliedUrlPartnersRef.current = true;
    const personId = normalizeTreeViewerGedcomXref(rootId) ?? rootId;
    dispatch({ type: "DRAWER_SELECT_ALL", personId });
  }, [
    initialPartnersUrl,
    initialRevealSpouseXref,
    chartStrategy,
    chartAdapter,
    isChartLoading,
    chartDataKey,
    dispatch,
    rootId,
  ]);

  useEffect(() => {
    if (initialRevealSpouseXref != null) return;
    if (initialPartnersUrl === "root") return;
    if (initialPartnersUrl == null) return;
    if (chartStrategy !== "descendancy") return;
    if (!chartAdapter || isChartLoading) return;
    if (appliedUrlPartnersRef.current) return;
    appliedUrlPartnersRef.current = true;
    dispatch({
      type: initialPartnersUrl === "open" ? "REVEAL_ALL_SPOUSES" : "CLOSE_ALL_SPOUSES",
    });
  }, [initialPartnersUrl, initialRevealSpouseXref, chartStrategy, chartAdapter, isChartLoading, dispatch]);

  const descendantsPartnersAllOpen =
    chartStrategy === "descendancy" && isAllSpousesRevealed(revealedUnions, rootId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = new URLSearchParams(window.location.search);
    const rootNorm = normalizeTreeViewerGedcomXref(rootId) ?? rootId;
    const scopedAtRoot =
      familyUnitScope != null && familyUnitScope.personId === rootNorm;
    const revealSpouseFromScope = scopedAtRoot ? familyUnitScope.spouseId : null;
    const familyFromScope = scopedAtRoot ? familyUnitScope.familyXref : null;
    const hasFamilyUnitSpouse = Boolean(
      existing.get("spouse")?.trim() ||
        initialRevealSpouseXref ||
        revealSpouseFromScope
    );
    const partnersUrl: TreeViewerPartnersUrl | null =
      chartStrategy === "descendancy" && !hasFamilyUnitSpouse
        ? isRootAllPartnersRevealed(revealedUnions, rootId)
          ? "root"
          : descendantsPartnersAllOpen
            ? "open"
            : "closed"
        : null;
    const next = buildTreeViewerSearchParams(
      {
        rootId,
        chartStrategy,
        depth: effectiveCurrentDepth,
        personCardLayout,
        personCardVariant,
        compactCardSize,
        parentPairGap,
        partnersUrl,
        revealSpouseXref:
          existing.get("spouse") ?? revealSpouseFromScope ?? initialRevealSpouseXref,
        familyXref: existing.get("family") ?? familyFromScope ?? initialFamilyXref,
        pedigreeFamcFamilyXref: isAncestorChart ? (pedigreeFamcFamilyXref ?? null) : null,
      },
      existing
    );
    if (treeViewerSearchParamsEqual(existing, next)) return;
    const u = new URL(window.location.href);
    u.search = next.toString() ? `?${next.toString()}` : "";
    window.history.replaceState(null, "", `${u.pathname}${u.search}${u.hash}`);
  }, [
    rootId,
    chartStrategy,
    isAncestorChart,
    effectiveCurrentDepth,
    personCardLayout,
    personCardVariant,
    compactCardSize,
    parentPairGap,
    descendantsPartnersAllOpen,
    revealedUnions,
    pedigreeFamcFamilyXref,
    initialRevealSpouseXref,
    initialFamilyXref,
    familyUnitScope,
  ]);
}
