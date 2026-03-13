"use client";

import { memo } from "react";
import type { ChartNode, ConnectorHelpers } from "@/descendancy-chart";
import type { PersonCardAction } from "@/descendancy-chart";
import type { ChartSettings } from "./ChartPanels/SettingsPanel";
import { useTreeNodeViewSet } from "./TreeNodeViewContext";
import { getTreeNodeViewSet } from "./TreeNodeViewFactory";
import { TreeNodes } from "../DescendancyChart/FamilyTreeNodes";

export interface ChartContentProps {
  root: ChartNode;
  rootId: string;
  onAction?: (action: PersonCardAction, personId: string) => void;
  settings?: ChartSettings;
  connectors?: ConnectorHelpers;
}

/**
 * Memoized chart content (connectors + spouse lines + tree nodes).
 * Uses TreeNodeViewSet from context so the active strategy determines ConnectorLines, SpouseJoinLines, and node views.
 */
export const ChartContent = memo(function ChartContent({
  root,
  rootId,
  onAction,
  settings,
  connectors,
}: ChartContentProps) {
  const viewSet = useTreeNodeViewSet() ?? getTreeNodeViewSet("descendancy");
  if (!viewSet) {
    return null;
  }
  const { ConnectorLines, SpouseJoinLines, PersonNodeView, UnionNodeView } = viewSet;
  return (
    <>
      <ConnectorLines root={root} connectors={connectors} />
      <SpouseJoinLines root={root} />
      <TreeNodes
        root={root}
        rootId={rootId}
        onAction={onAction}
        settings={settings}
        personNodeView={PersonNodeView}
        unionNodeView={UnionNodeView}
      />
    </>
  );
});
