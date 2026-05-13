"use client";

import { useCallback } from "react";
import type { ChartViewStrategyName, TreeAction } from "@/genealogy-visualization-engine";
import {
  chartSwitchSessionBegin,
  chartSwitchTimeAsync,
} from "@/genealogy-visualization-engine/debug/chartSwitchTiming";
import type { FamiliesAsChildResponse } from "../PersonDetailOverlay/types";
import { normalizeGedcomXref } from "../PersonDetailOverlay/utils";
import { resolveDefaultRootPedigreeFamc } from "@/lib/pedigreeDefaultFamc";
import { isAncestorChartStrategy } from "../chartStrategy";

export type LoadFamiliesAsChildFn = (xref: string) => Promise<FamiliesAsChildResponse | null>;

export interface UseChartStrategyChangeParams {
  chartStrategy: ChartViewStrategyName;
  rootId: string;
  pedigreeFamcFamilyXref: string | null | undefined;
  dispatch: (action: TreeAction) => void;
  loadFamiliesAsChild: LoadFamiliesAsChildFn;
}

export function useChartStrategyChange({
  chartStrategy,
  rootId,
  pedigreeFamcFamilyXref,
  dispatch,
  loadFamiliesAsChild,
}: UseChartStrategyChangeParams) {
  const handleChartStrategyChange = useCallback(
    async (next: ChartViewStrategyName) => {
      chartSwitchSessionBegin({ from: chartStrategy, to: next });

      if (next === "descendancy") {
        dispatch({ type: "SET_VIEW_STRATEGY", strategyName: next });
        return;
      }
      if (!isAncestorChartStrategy(next)) {
        dispatch({ type: "SET_VIEW_STRATEGY", strategyName: next });
        return;
      }

      const existingFamcRaw = pedigreeFamcFamilyXref ?? "";
      const existingFamcNorm = existingFamcRaw.trim()
        ? normalizeGedcomXref(existingFamcRaw)
        : "";
      const fromPed = isAncestorChartStrategy(chartStrategy);

      const famcMatchesFamilyList = (
        families: FamiliesAsChildResponse["familiesOfOrigin"]
      ): boolean =>
        Boolean(
          existingFamcNorm &&
            families.some((f) => normalizeGedcomXref(f.family.xref) === existingFamcNorm)
        );

      const json = await chartSwitchTimeAsync("families-as-child API (GET …/families-as-child)", () =>
        loadFamiliesAsChild(rootId)
      );
      const families = json?.familiesOfOrigin ?? [];

      /** Horizontal ↔ vertical pedigree: keep current FAMC when still valid */
      if (fromPed && existingFamcNorm) {
        if (families.length === 0) {
          dispatch({
            type: "SET_VIEW_STRATEGY",
            strategyName: next,
            pedigreeFamcFamilyXref: existingFamcNorm,
          });
          return;
        }
        if (families.length === 1) {
          const only = normalizeGedcomXref(families[0].family.xref);
          dispatch({
            type: "SET_VIEW_STRATEGY",
            strategyName: next,
            pedigreeFamcFamilyXref: only || existingFamcNorm,
          });
          return;
        }
        if (famcMatchesFamilyList(families)) {
          dispatch({
            type: "SET_VIEW_STRATEGY",
            strategyName: next,
            pedigreeFamcFamilyXref: existingFamcNorm,
          });
          return;
        }
        dispatch({
          type: "SET_VIEW_STRATEGY",
          strategyName: next,
          pedigreeFamcFamilyXref: existingFamcNorm,
        });
        return;
      }

      /** Descendancy (or fresh) → pedigree: always switch immediately; default to birth lineage */
      if (!json) {
        dispatch({ type: "SET_VIEW_STRATEGY", strategyName: next });
        return;
      }

      let defaultFamc: string | null = null;
      if (families.length === 1 && families[0].family.xref?.trim()) {
        defaultFamc = normalizeGedcomXref(families[0].family.xref);
      } else if (families.length > 1) {
        defaultFamc = resolveDefaultRootPedigreeFamc(families);
      }

      dispatch({
        type: "SET_VIEW_STRATEGY",
        strategyName: next,
        pedigreeFamcFamilyXref: defaultFamc,
      });
    },
    [chartStrategy, dispatch, rootId, pedigreeFamcFamilyXref, loadFamiliesAsChild]
  );

  return { handleChartStrategyChange };
}
