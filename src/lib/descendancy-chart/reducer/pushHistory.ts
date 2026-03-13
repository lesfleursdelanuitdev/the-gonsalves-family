/**
 * Pure transition helper: compute next history and historyIndex after a navigation.
 */

import { MAX_HISTORY } from "../constants";
import type { TreeState } from "./types";

export function pushHistory(
  state: TreeState,
  newRootId: string,
  newViewState: unknown,
  actionLabel: string,
  triggerPersonId?: string
): { history: TreeState["history"]; historyIndex: number } {
  const truncated = state.history.slice(0, state.historyIndex + 1);
  const entry: TreeState["history"][0] = { rootId: newRootId, viewState: newViewState, actionLabel };
  if (triggerPersonId !== undefined) entry.triggerPersonId = triggerPersonId;
  const next = [...truncated, entry];
  const history = next.slice(-MAX_HISTORY);
  const historyIndex = history.length - 1;
  return { history, historyIndex };
}
