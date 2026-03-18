/**
 * Types for strategy-specific chart view components.
 * The factory returns a set of components so ChartContent and TreeNodes can render without hard-coding descendancy.
 */

import type { ComponentType } from "react";
import type { ChartNode, ConnectorHelpers } from "@/genealogy-visualization-engine";
import type { PersonCardProps } from "../../DescendancyChart/FamilyTreeNodes/PersonNodeView";
import type { UnionRowProps } from "../../DescendancyChart/FamilyTreeNodes/UnionNodeView";

export interface ConnectorLinesProps {
  root: ChartNode;
  connectors?: ConnectorHelpers;
}

export interface SpouseJoinLinesProps {
  root: ChartNode;
}

/** Re-export so TreeNodes can type optional view components. */
export type { PersonCardProps as PersonNodeViewProps, UnionRowProps as UnionNodeViewProps };

/**
 * View set for one strategy: connectors and node view components.
 */
export interface TreeNodeViewSet {
  ConnectorLines: ComponentType<ConnectorLinesProps>;
  SpouseJoinLines: ComponentType<SpouseJoinLinesProps>;
  PersonNodeView: ComponentType<PersonCardProps>;
  UnionNodeView: ComponentType<UnionRowProps>;
}
