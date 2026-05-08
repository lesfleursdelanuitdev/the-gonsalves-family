import type { PersonDisplayActionState } from "../types";

export interface BuildPersonDisplayActionsParams {
  actions?: PersonDisplayActionState[];
}

export function buildPersonDisplayActions(
  params: BuildPersonDisplayActionsParams
): PersonDisplayActionState[] {
  return params.actions ?? [];
}
