"use client";

import { memo } from "react";
import type { ChartNode, ChartViewStrategyName, ConnectorHelpers, ViewState } from "@/genealogy-visualization-engine";
import type { PersonCardLayoutSettings } from "@/lib/person-card-layout";
import type { PersonCardAction } from "@/genealogy-visualization-engine";
import { useTreeNodeViewSet } from "@/providers/TreeNodeViewContext";
import { TreeNodes, type OnNameClick, type PedigreeRootSiblingNode } from "../../DescendancyChart/FamilyTreeNodes";
import { getEffectivePersonHeight } from "@/lib/personNodeHeight";
import { PersonNode, UnionNode } from "@/genealogy-visualization-engine";
import { FanChartContent } from "./fan/FanChartContent";
import type { FanMoreClickPayload } from "./fan/fanPeekTypes";
import { shouldRenderConnectorsForStrategy } from "./chartStrategy";
import {
  resolvePersonDisplayVariant,
  resolveRequestedVariantFromCardSettings,
} from "./personDisplay";
import { PersonDisplayNodeView } from "./personDisplay/PersonDisplayNodeView";

/** Minimal settings shape used by chart content (compatible with v1 ChartSettings and v2 ChartSettingsV2). */
export type ChartContentSettings = {
  showDates?: boolean;
  showPhotos?: boolean;
  showUnknown?: boolean;
  showCardActionIcons?: boolean;
  autoLegendModal?: boolean;
  pedigreeConnectorStyle?: "classic" | "midline";
  fanRootRadius?: number;
} & PersonCardLayoutSettings;

export interface ChartContentProps {
  root: ChartNode;
  rootId: string;
  onAction?: (action: PersonCardAction, personId: string) => void;
  onNameClick?: OnNameClick;
  /** Fan chart: “more” chip opens peek modal (not used for other strategies). */
  onFanMoreClick?: (payload: FanMoreClickPayload) => void;
  settings?: ChartContentSettings;
  connectors?: ConnectorHelpers;
  viewState?: ViewState;
  chartStrategy?: ChartViewStrategyName;
  isMobile?: boolean;
  pedigreeHasRoomToExpandDepth?: boolean;
  pedigreeMultiFamilyChildXrefs?: string[] | null;
  pedigreeRootSiblings?: PedigreeRootSiblingNode[] | null;
  pedigreeRootChildren?: PedigreeRootSiblingNode[] | null;
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
  onFanMoreClick,
  settings,
  connectors,
  viewState,
  chartStrategy = "descendancy",
  isMobile = false,
  pedigreeHasRoomToExpandDepth = false,
  pedigreeMultiFamilyChildXrefs = null,
  pedigreeRootSiblings = null,
  pedigreeRootChildren = null,
}: ChartContentProps) {
  const viewSet = useTreeNodeViewSet();
  const requestedDisplayVariant = resolveRequestedVariantFromCardSettings({
    strategy: chartStrategy,
    personCardLayout: settings?.personCardLayout,
    personCardVariant: settings?.personCardVariant,
    compactCardSize: settings?.compactCardSize,
    isMobile,
  });
  const personDisplayVariant = resolvePersonDisplayVariant({
    strategy: chartStrategy,
    requestedVariant: requestedDisplayVariant,
    isMobile,
  });
  const isFanDisplay = personDisplayVariant.startsWith("fan.");

  const fanDepthFromRoot = (node: ChartNode): number => {
    if (!(node instanceof PersonNode)) return 0;
    const walk = (person: PersonNode, generation: number): number => {
      const parentUnion = person.children[0];
      if (!(parentUnion instanceof UnionNode)) return generation;
      const [left, right] = parentUnion.content;
      let maxGeneration = generation;
      if (left) maxGeneration = Math.max(maxGeneration, walk(left, generation + 1));
      if (right) maxGeneration = Math.max(maxGeneration, walk(right, generation + 1));
      return maxGeneration;
    };
    return walk(node, 0);
  };

  if (isFanDisplay) {
    return (
      <FanChartContent
        root={root}
        generationCount={fanDepthFromRoot(root)}
        rootRadius={settings?.fanRootRadius}
        pedigreeMultiFamilyChildXrefs={pedigreeMultiFamilyChildXrefs}
        onMoreClick={onFanMoreClick}
      />
    );
  }

  if (!viewSet) {
    return null;
  }
  const { ConnectorLines, SpouseJoinLines, UnionNodeView } = viewSet;
  const personHeight = getEffectivePersonHeight(settings, { chartStrategy, isMobile });
  const showTreeConnectors = shouldRenderConnectorsForStrategy(chartStrategy);
  return (
    <>
      {showTreeConnectors ? (
        <>
          <ConnectorLines
            root={root}
            connectors={connectors}
            personHeight={personHeight}
            connectorStyle={settings?.pedigreeConnectorStyle}
            hasPedigreeRootSiblings={Boolean(pedigreeRootSiblings?.length)}
            hasPedigreeRootChildren={Boolean(pedigreeRootChildren?.length)}
          />
          <SpouseJoinLines root={root} />
        </>
      ) : null}
      <TreeNodes
        root={root}
        rootId={rootId}
        onAction={onAction}
        onNameClick={onNameClick}
        settings={settings}
        viewState={viewState}
        personNodeView={PersonDisplayNodeView}
        unionNodeView={UnionNodeView}
        chartStrategy={chartStrategy}
        isMobile={isMobile}
        pedigreeHasRoomToExpandDepth={pedigreeHasRoomToExpandDepth}
        pedigreeMultiFamilyChildXrefs={pedigreeMultiFamilyChildXrefs}
        personHeight={personHeight}
        pedigreeRootSiblings={pedigreeRootSiblings}
        pedigreeRootChildren={pedigreeRootChildren}
      />
    </>
  );
});
