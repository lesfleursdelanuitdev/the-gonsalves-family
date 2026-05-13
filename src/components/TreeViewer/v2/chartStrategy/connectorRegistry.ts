import type { ChartViewStrategyName, ConnectorHelpers } from "@/genealogy-visualization-engine";
import type { ViewStrategyDescriptor } from "@/genealogy-visualization-engine";
import { CHART_STRATEGY_META } from "./chartStrategyMeta";

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

function toConnectorMode(strategy: ChartViewStrategyName): ConnectorMode {
  return CHART_STRATEGY_META[strategy].capabilities.relationshipMode === "explicit"
    ? "tree"
    : "none";
}

export const CONNECTOR_REGISTRY: Record<ChartViewStrategyName, ConnectorRegistration> = {
  descendancy: toConnectorMode("descendancy") === "tree" ? TREE_CONNECTOR_REGISTRATION : NONE_CONNECTOR_REGISTRATION,
  pedigree: toConnectorMode("pedigree") === "tree" ? TREE_CONNECTOR_REGISTRATION : NONE_CONNECTOR_REGISTRATION,
  vertical_pedigree:
    toConnectorMode("vertical_pedigree") === "tree" ? TREE_CONNECTOR_REGISTRATION : NONE_CONNECTOR_REGISTRATION,
  fan_chart: toConnectorMode("fan_chart") === "tree" ? TREE_CONNECTOR_REGISTRATION : NONE_CONNECTOR_REGISTRATION,
};

export function getConnectorRegistration(
  strategy: ChartViewStrategyName
): ConnectorRegistration {
  return CONNECTOR_REGISTRY[strategy];
}
