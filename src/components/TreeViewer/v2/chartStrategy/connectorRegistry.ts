import type { ChartViewStrategyName, ConnectorHelpers } from "@/genealogy-visualization-engine";
import type { ViewStrategyDescriptor } from "@/genealogy-visualization-engine";

export type ConnectorMode = "tree" | "none";

export interface ConnectorRegistration {
  mode: ConnectorMode;
  resolveHelpers: (
    descriptor: ViewStrategyDescriptor,
    personHeight: number
  ) => ConnectorHelpers | null;
}

const TREE_CONNECTOR_REGISTRATION: ConnectorRegistration = {
  mode: "tree",
  resolveHelpers: (descriptor, personHeight) =>
    descriptor.getConnectors?.(personHeight) ?? descriptor.connectors,
};

const NONE_CONNECTOR_REGISTRATION: ConnectorRegistration = {
  mode: "none",
  resolveHelpers: () => null,
};

export const CONNECTOR_REGISTRY: Record<ChartViewStrategyName, ConnectorRegistration> = {
  descendancy: TREE_CONNECTOR_REGISTRATION,
  pedigree: TREE_CONNECTOR_REGISTRATION,
  vertical_pedigree: TREE_CONNECTOR_REGISTRATION,
  fan_chart: NONE_CONNECTOR_REGISTRATION,
};

export function getConnectorRegistration(
  strategy: ChartViewStrategyName
): ConnectorRegistration {
  return CONNECTOR_REGISTRY[strategy];
}
