import type { PersonDisplayRenderContext } from "../../types";
import type { PersonDisplayVariantId } from "../../variants";
import type { ReactNode } from "react";

export interface RenderTreePersonDisplayParams {
  ctx: PersonDisplayRenderContext;
  variant: PersonDisplayVariantId;
}

export function renderTreePersonDisplay({
  ctx: _ctx,
  variant: _variant,
}: RenderTreePersonDisplayParams): ReactNode {
  // Placeholder: real tree renderer wiring comes in the next integration step.
  return null;
}
