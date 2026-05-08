import type { ChartViewStrategyName, ConnectorHelpers } from "@/genealogy-visualization-engine";
import type { ViewStrategyDescriptor } from "@/genealogy-visualization-engine";
import { getConnectorRegistration } from "./connectorRegistry";

export function resolveConnectorsForStrategy(
  strategy: ChartViewStrategyName,
  descriptor: ViewStrategyDescriptor,
  personHeight: number
): ConnectorHelpers | null {
  return getConnectorRegistration(strategy).resolveHelpers(descriptor, personHeight);
}

export function shouldRenderConnectorsForStrategy(
  strategy: ChartViewStrategyName
): boolean {
  return getConnectorRegistration(strategy).mode === "tree";
}
