"use client";

import { useEffect, useRef } from "react";
import {
  isAllSpousesRevealed,
  type ChartViewStrategyName,
  type TreeAction,
  type ViewState,
} from "@/genealogy-visualization-engine";
import type { PersonCardLayout, PersonCardVariant, PersonCompactCardSize } from "@/lib/person-card-layout";
import type { TreeViewerPartnersUrl } from "@/lib/treeViewerUrl";
import {
  buildTreeViewerSearchParams,
  treeViewerSearchParamsEqual,
} from "@/lib/treeViewerUrl";

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
  chartAdapter: unknown;
  isChartLoading: boolean;
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
  chartAdapter,
  isChartLoading,
  dispatch,
}: UseTreeViewerUrlSyncParams) {
  const appliedUrlPartnersRef = useRef(false);

  useEffect(() => {
    appliedUrlPartnersRef.current = false;
  }, [initialPartnersUrl]);

  useEffect(() => {
    if (initialPartnersUrl == null) return;
    if (chartStrategy !== "descendancy") return;
    if (!chartAdapter || isChartLoading) return;
    if (appliedUrlPartnersRef.current) return;
    appliedUrlPartnersRef.current = true;
    dispatch({
      type: initialPartnersUrl === "open" ? "REVEAL_ALL_SPOUSES" : "CLOSE_ALL_SPOUSES",
    });
  }, [initialPartnersUrl, chartStrategy, chartAdapter, isChartLoading, dispatch]);

  const descendantsPartnersAllOpen =
    chartStrategy === "descendancy" && isAllSpousesRevealed(revealedUnions);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const partnersUrl: TreeViewerPartnersUrl | null =
      chartStrategy === "descendancy"
        ? descendantsPartnersAllOpen
          ? "open"
          : "closed"
        : null;
    const existing = new URLSearchParams(window.location.search);
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
        pedigreeFamcFamilyXref:
          isAncestorChart
            ? (pedigreeFamcFamilyXref ?? null)
            : null,
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
    pedigreeFamcFamilyXref,
  ]);
}
