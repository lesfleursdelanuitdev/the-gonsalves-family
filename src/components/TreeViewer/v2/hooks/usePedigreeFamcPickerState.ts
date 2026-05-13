"use client";

import { useCallback, useState } from "react";
import type { FamiliesAsChildResponse } from "../PersonDetailOverlay/types";

export type PedigreeFamcPickerState = null | {
  strategyName: "pedigree" | "vertical_pedigree" | "fan_chart";
  families: FamiliesAsChildResponse["familiesOfOrigin"];
  forPersonId?: string | null;
};

export function usePedigreeFamcPickerState() {
  const [pedigreeFamcPicker, setPedigreeFamcPicker] = useState<PedigreeFamcPickerState>(null);
  const closePedigreeFamcPicker = useCallback(() => {
    setPedigreeFamcPicker(null);
  }, []);

  return { pedigreeFamcPicker, setPedigreeFamcPicker, closePedigreeFamcPicker };
}
