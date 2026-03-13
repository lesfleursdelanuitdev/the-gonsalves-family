/**
 * Action: ROOT — set root person and reset view state via current strategy.
 */

import type { TreeState } from "./types";
import { pushHistory } from "./pushHistory";
import { getStrategyReducer } from "./strategies/registry";

export function applyRoot(state: TreeState, personId: string): TreeState {
  const strategy = getStrategyReducer(state.strategyName);
  const newViewState = strategy?.getInitialViewState() ?? {};
  const hist = pushHistory(state, personId, newViewState, "Set as root");
  return {
    ...state,
    rootId: personId,
    viewState: newViewState,
    ...hist,
  };
}
