import type { ChartViewStrategyName, DescendancyPerson } from "@/genealogy-visualization-engine";
import type { ReactNode } from "react";
import type { PersonDisplayRenderContext } from "../types";
import type { PersonDisplayVariantId } from "../variants";
import type { PersonCardAction } from "@/genealogy-visualization-engine";
import { renderTreePersonDisplay } from "../renderers/tree/treePersonDisplayRenderer";
import { renderFanPersonDisplay } from "../renderers/fan/fanPersonDisplayRenderer";

export type PersonDisplayRenderer = (ctx: PersonDisplayRenderContext) => ReactNode;

export interface BuildPersonDisplayRendererParams {
  strategy: ChartViewStrategyName;
  variant: PersonDisplayVariantId;
  /** Person data for the node being rendered. */
  person: DescendancyPerson;
  cx: number;
  y: number;
  onAction?: (action: PersonCardAction, personId: string) => void;
  onNameClick?: (person: {
    name: string;
    xref: string;
    uuid: string | null;
    isLiving?: boolean;
    birthYear?: number | null;
  }) => void;
}

export function buildPersonDisplayRenderer({
  strategy,
  variant,
  person,
  cx,
  y,
  onAction,
  onNameClick,
}: BuildPersonDisplayRendererParams): PersonDisplayRenderer {
  if (strategy === "fan_chart") {
    return (ctx) => renderFanPersonDisplay({ ctx, variant });
  }
  return (ctx) =>
    renderTreePersonDisplay({ ctx, variant, person, cx, y, onAction, onNameClick });
}
