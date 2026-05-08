import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import type { ReactNode } from "react";
import type { PersonDisplayVariantId } from "./variants";

export interface PersonDisplayData {
  personId: string;
  xref?: string | null;
  uuid?: string | null;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  dates?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  metadata?: {
    hasMultipleFamiliesAsChild?: boolean;
    [key: string]: unknown;
  };
}

export interface PersonDisplayLayoutBase {
  x?: number;
  y?: number;
}

export interface TreePersonDisplayLayout extends PersonDisplayLayoutBase {
  kind: "tree";
  cx?: number;
  top?: number;
}

export interface FanPersonDisplayLayout extends PersonDisplayLayoutBase {
  kind: "fan";
  startAngle?: number;
  endAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export type PersonDisplayLayout = TreePersonDisplayLayout | FanPersonDisplayLayout;

export interface PersonDisplayActionState {
  id: string;
  label: string;
  enabled: boolean;
  disabledReason?: string;
}

export interface PersonDisplayRenderContext {
  isMobile: boolean;
}

export interface PersonDisplay {
  viewStrategy: ChartViewStrategyName;
  displayVariant: PersonDisplayVariantId;
  personData: PersonDisplayData;
  layout: PersonDisplayLayout;
  actions: PersonDisplayActionState[];
  render: (ctx: PersonDisplayRenderContext) => ReactNode;
}
