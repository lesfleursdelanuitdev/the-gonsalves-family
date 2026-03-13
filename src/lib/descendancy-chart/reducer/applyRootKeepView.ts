/**
 * Action: ROOT_KEEP_VIEW — set root person but keep current view state (e.g. revealed spouses).
 * Use for "Home" so the tree only pans/zooms to the root; visibility is unchanged.
 */

import type { TreeState } from "./types";
import { pushHistory } from "./pushHistory";

export function applyRootKeepView(state: TreeState, personId: string): TreeState {
  const hist = pushHistory(state, personId, state.viewState, "Go to root");
  return {
    ...state,
    rootId: personId,
    ...hist,
  };
}
