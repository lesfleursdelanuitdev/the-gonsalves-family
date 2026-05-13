"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TreeAction } from "@/genealogy-visualization-engine";
import { normalizeGedcomXref } from "../PersonDetailOverlay/utils";
import type { PedigreeFamcPickerState } from "./usePedigreeFamcPickerState";

export interface UsePedigreeFamcPickerActionsParams {
  effectiveRootId: string;
  pedigreeFamcPicker: PedigreeFamcPickerState;
  setPedigreeFamcPicker: Dispatch<SetStateAction<PedigreeFamcPickerState>>;
  dispatch: (action: TreeAction) => void;
}

export function usePedigreeFamcPickerActions({
  effectiveRootId,
  pedigreeFamcPicker,
  setPedigreeFamcPicker,
  dispatch,
}: UsePedigreeFamcPickerActionsParams) {
  const closePedigreeFamcPicker = useCallback(() => {
    setPedigreeFamcPicker(null);
  }, [setPedigreeFamcPicker]);

  const onSelectPedigreeFamcFamily = useCallback(
    (familyXref: string) => {
      const norm = normalizeGedcomXref(familyXref);
      const pick = pedigreeFamcPicker;
      const target = pick?.forPersonId?.trim() || null;
      const rootNorm = normalizeGedcomXref(effectiveRootId);
      if (target && normalizeGedcomXref(target) !== rootNorm) {
        dispatch({
          type: "PEDIGREE_SET_FAMC_FOR_PERSON",
          personId: target,
          familyXref: norm,
        });
      } else {
        dispatch({ type: "PEDIGREE_SET_FAMC_FAMILY_XREF", familyXref: norm });
      }
      setPedigreeFamcPicker(null);
    },
    [pedigreeFamcPicker, effectiveRootId, dispatch, setPedigreeFamcPicker]
  );

  return { closePedigreeFamcPicker, onSelectPedigreeFamcFamily };
}
