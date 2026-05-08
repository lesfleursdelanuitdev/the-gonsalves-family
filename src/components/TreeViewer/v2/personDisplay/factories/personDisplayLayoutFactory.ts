import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import type { PersonDisplayLayout } from "../types";

export interface BuildPersonDisplayLayoutParams {
  strategy: ChartViewStrategyName;
  layout: PersonDisplayLayout;
}

export function buildPersonDisplayLayout(
  params: BuildPersonDisplayLayoutParams
): PersonDisplayLayout {
  // Placeholder: keep caller-provided layout until adapters are wired.
  return params.layout;
}
