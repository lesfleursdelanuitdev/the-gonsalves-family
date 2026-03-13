/**
 * Registry of strategy name → TreeNodeViewSet.
 * ChartContent uses getTreeNodeViewSet(strategyName) to get ConnectorLines, SpouseJoinLines, and node views.
 */

import type { TreeNodeViewSet } from "./types";

const registry = new Map<string, TreeNodeViewSet>();

export function registerTreeNodeViewSet(strategyName: string, set: TreeNodeViewSet): void {
  registry.set(strategyName, set);
}

export function getTreeNodeViewSet(strategyName: string): TreeNodeViewSet | undefined {
  return registry.get(strategyName);
}
