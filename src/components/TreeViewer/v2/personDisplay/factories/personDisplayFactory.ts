import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import {
  buildPersonDisplayData,
  type BuildPersonDisplayDataParams,
} from "./personDisplayDataFactory";
import {
  buildPersonDisplayLayout,
  type BuildPersonDisplayLayoutParams,
} from "./personDisplayLayoutFactory";
import {
  buildPersonDisplayActions,
  type BuildPersonDisplayActionsParams,
} from "./personDisplayActionsFactory";
import {
  buildPersonDisplayRenderer,
  type BuildPersonDisplayRendererParams,
} from "./personDisplayRendererFactory";
import {
  resolvePersonDisplayVariant,
  type ResolvePersonDisplayVariantParams,
} from "./personDisplayVariantFactory";
import type { PersonDisplay } from "../types";

export interface BuildPersonDisplayParams {
  strategy: ChartViewStrategyName;
  isMobile: boolean;
  requestedVariant?: ResolvePersonDisplayVariantParams["requestedVariant"];
  data: BuildPersonDisplayDataParams;
  layout: BuildPersonDisplayLayoutParams["layout"];
  actions?: BuildPersonDisplayActionsParams["actions"];
}

export function buildPersonDisplay(params: BuildPersonDisplayParams): PersonDisplay {
  const displayVariant = resolvePersonDisplayVariant({
    strategy: params.strategy,
    requestedVariant: params.requestedVariant,
    isMobile: params.isMobile,
  });

  const personData = buildPersonDisplayData(params.data);
  const layout = buildPersonDisplayLayout({
    strategy: params.strategy,
    layout: params.layout,
  });
  const actions = buildPersonDisplayActions({ actions: params.actions });
  const render = buildPersonDisplayRenderer({
    strategy: params.strategy,
    variant: displayVariant,
  } as BuildPersonDisplayRendererParams);

  return {
    viewStrategy: params.strategy,
    displayVariant,
    personData,
    layout,
    actions,
    render,
  };
}
