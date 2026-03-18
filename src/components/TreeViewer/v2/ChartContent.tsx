"use client";

import { memo } from "react";
import type { ChartNode, ConnectorHelpers, ViewState } from "@/genealogy-visualization-engine";
import type { PersonCardAction } from "@/genealogy-visualization-engine";
import { useTreeNodeViewSet } from "@/providers/TreeNodeViewContext";
import { getTreeNodeViewSet } from "../TreeNodeViewFactory";
import { TreeNodes, type OnNameClick } from "../../DescendancyChart/FamilyTreeNodes";

/** Minimal settings shape used by chart content (compatible with v1 ChartSettings and v2 ChartSettingsV2). */
export type ChartContentSettings = {
  showDates?: boolean;
  showPhotos?: boolean;
  showUnknown?: boolean;
  autoLegendModal?: boolean;
};

export interface ChartContentProps {
  root: ChartNode;
  rootId: string;
  onAction?: (action: PersonCardAction, personId: string) => void;
  onNameClick?: OnNameClick;
  settings?: ChartContentSettings;
  connectors?: ConnectorHelpers;
  viewState?: ViewState;
}

/**
 * Memoized chart content (connectors + spouse lines + tree nodes).
 * Uses TreeNodeViewSet from context so the active strategy determines ConnectorLines, SpouseJoinLines, and node views.
 */
export const ChartContent = memo(function ChartContent({
  root,
  rootId,
  onAction,
  onNameClick,
  settings,
  connectors,
  viewState,
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
        onNameClick={onNameClick}
        settings={settings}
        viewState={viewState}
        personNodeView={PersonNodeView}
        unionNodeView={UnionNodeView}
      />
    </>
  );
});
