import type { PersonDisplayActionState } from "../../types";

export interface BuildFanPersonActionsParams {
  actions?: PersonDisplayActionState[];
}

export function buildFanPersonActions(
  params: BuildFanPersonActionsParams
): PersonDisplayActionState[] {
  return params.actions ?? [];
}
