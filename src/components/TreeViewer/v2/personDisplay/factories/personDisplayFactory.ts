import type { ChartViewStrategyName, DescendancyPerson, PersonCardAction } from "@/genealogy-visualization-engine";
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
  /** Raw person node — needed by the renderer closure. */
  person: DescendancyPerson;
  cx: number;
  y: number;
  onAction?: (action: PersonCardAction, personId: string) => void;
  onNameClick?: (person: { name: string; xref: string; uuid: string | null }) => void;
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
    person: params.person,
    cx: params.cx,
    y: params.y,
    onAction: params.onAction,
    onNameClick: params.onNameClick,
  });

  return {
    viewStrategy: params.strategy,
    displayVariant,
    personData,
    layout,
    actions,
    render,
  };
}
