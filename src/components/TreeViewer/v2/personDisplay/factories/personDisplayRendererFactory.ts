import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import type { ReactNode } from "react";
import type { PersonDisplayRenderContext } from "../types";
import type { PersonDisplayVariantId } from "../variants";
import { renderTreePersonDisplay } from "../renderers/tree/treePersonDisplayRenderer";
import { renderFanPersonDisplay } from "../renderers/fan/fanPersonDisplayRenderer";

export type PersonDisplayRenderer = (ctx: PersonDisplayRenderContext) => ReactNode;

export interface BuildPersonDisplayRendererParams {
  strategy: ChartViewStrategyName;
  variant: PersonDisplayVariantId;
}

export function buildPersonDisplayRenderer({
  strategy,
  variant,
}: BuildPersonDisplayRendererParams): PersonDisplayRenderer {
  if (strategy === "fan_chart") {
    return (ctx) => renderFanPersonDisplay({ ctx, variant });
  }
  return (ctx) => renderTreePersonDisplay({ ctx, variant });
}
