"use client";

import type { PersonCardAction, TreeAction, ViewState } from "@/genealogy-visualization-engine";
import { DEFAULT_PEDIGREE_DEPTH, getPeople } from "@/genealogy-visualization-engine";

export interface HandlePedigreeCardActionContext {
  dispatch: (action: TreeAction) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setRootDisplayNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  triggerBlinkBack: () => void;
  viewState: ViewState;
  /** Depth shown in UI / used for pedigree build when `currentDepth` unset. */
  displayedDepth: number;
  /** Opens the multi-family picker (fetches families-as-child for `personId`). */
  openChooseParentFamily: (personId: string) => void | Promise<void>;
}

export function handlePedigreeCardAction(
  action: PersonCardAction,
  personId: string,
  ctx: HandlePedigreeCardActionContext
): void {
  const {
    dispatch,
    setPan,
    setRootDisplayNames,
    triggerBlinkBack,
    viewState,
    displayedDepth,
    openChooseParentFamily,
  } = ctx;

  switch (action) {
    case "pedigreeReroot": {
      const peopleMap = getPeople();
      const person = peopleMap.get(personId);
      if (person) {
        const name = (`${person.firstName} ${person.lastName}`).trim();
        setRootDisplayNames((prev) => ({ ...prev, [personId]: name }));
      }
      dispatch({ type: "ROOT", personId });
      setPan({ x: 0, y: 0 });
      triggerBlinkBack();
      break;
    }
    case "pedigreeChooseParentFamily":
      void openChooseParentFamily(personId);
      break;
    case "pedigreeCollapseAncestors":
      dispatch({ type: "PEDIGREE_COLLAPSE_ANCESTORS", personId });
      dispatch({ type: "PAN_TO_PERSON", personId });
      triggerBlinkBack();
      break;
    case "pedigreeRestoreAncestors":
      dispatch({ type: "PEDIGREE_CLEAR_ANCESTOR_COLLAPSE" });
      triggerBlinkBack();
      break;
    case "pedigreeExpandAncestors": {
      dispatch({ type: "PEDIGREE_CLEAR_ANCESTOR_COLLAPSE" });
      const base = viewState.currentDepth ?? displayedDepth;
      const next = Math.min(base + 1, DEFAULT_PEDIGREE_DEPTH);
      dispatch({ type: "SET_CURRENT_DEPTH", depth: next });
      triggerBlinkBack();
      break;
    }
    case "pedigreeShowSiblingsRoot":
    case "pedigreeShowChildrenRoot":
      break;
    default:
      break;
  }
}
