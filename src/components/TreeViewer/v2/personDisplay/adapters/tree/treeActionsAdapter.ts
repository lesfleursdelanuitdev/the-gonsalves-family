import type { PersonDisplayActionState } from "../../types";

export interface BuildTreePersonActionsParams {
  actions?: PersonDisplayActionState[];
}

export function buildTreePersonActions(
  params: BuildTreePersonActionsParams
): PersonDisplayActionState[] {
  return params.actions ?? [];
}
