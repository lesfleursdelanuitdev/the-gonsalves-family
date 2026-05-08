import type { PersonDisplayRenderContext } from "../../types";
import type { PersonDisplayVariantId } from "../../variants";
import type { ReactNode } from "react";

export interface RenderFanPersonDisplayParams {
  ctx: PersonDisplayRenderContext;
  variant: PersonDisplayVariantId;
}

export function renderFanPersonDisplay({
  ctx: _ctx,
  variant: _variant,
}: RenderFanPersonDisplayParams): ReactNode {
  // Placeholder: real fan renderer wiring comes in the next integration step.
  return null;
}
