"use client";

import type { ComponentType } from "react";
import type { ChartNode } from "@/descendancy-chart";
import { getUnionsByPerson, getParentUnionsByChild, getAllChildrenOf, UnionNode } from "@/descendancy-chart";
import type { PersonCardAction, ViewState } from "@/descendancy-chart";
import { PersonCard } from "./PersonNodeView";
import { UnionRow } from "./UnionNodeView";
import type { PersonCardProps } from "./PersonNodeView";
import type { UnionRowProps } from "./UnionNodeView";

export interface ChartSettings {
  showDates?: boolean;
  showPhotos?: boolean;
  showUnknown?: boolean;
}

interface TreeNodesProps {
  root: ChartNode;
  rootId: string;
  onAction?: (action: PersonCardAction, personId: string) => void;
  settings?: ChartSettings;
  /** For collapse/expand subtree: which person IDs have collapsed subtrees. */
  viewState?: ViewState;
  /** When provided (e.g. from TreeNodeViewFactory), use instead of PersonCard. */
  personNodeView?: ComponentType<PersonCardProps>;
  /** When provided (e.g. from TreeNodeViewFactory), use instead of UnionRow. */
  unionNodeView?: ComponentType<UnionRowProps>;
}

export function TreeNodes({
  root,
  rootId,
  onAction,
  settings,
  viewState,
  personNodeView: PersonNodeView = PersonCard,
  unionNodeView: UnionNodeView = UnionRow,
}: TreeNodesProps) {
  const collapsedSet = new Set(viewState?.collapsedSubtrees ?? []);
  const elements: React.ReactNode[] = [];

  function collect(node: ChartNode) {
    if (node instanceof UnionNode) {
      elements.push(
        <UnionNodeView
          key={`u-${node.x}-${node.y}`}
          node={node}
          rootId={rootId}
          onAction={onAction}
          settings={settings}
        />
      );
    } else {
      const isContainer =
        node.children.length > 0 &&
        node.children.every((c) => c instanceof UnionNode);
      if (!isContainer) {
        elements.push(
          <PersonNodeView
            key={
              node.content._isShadow
                ? `p-${node.content.id}-shadow-${node.x}-${node.y}`
                : `p-${node.content.id}`
            }
            cx={node.x}
            y={node.y}
            person={node.content}
            isRoot={node.content.id === rootId}
            hasSpouses={(getUnionsByPerson().get(node.content.id) ?? []).length > 0}
            hasParents={(getParentUnionsByChild().get(node.content.id) ?? []).length > 0}
            onlyRoot={!!node.content._onlyRoot}
            isLeaf={node.children.length === 0}
            hasDescendantsInData={(getAllChildrenOf(node.content.id) ?? []).length > 0}
            isSubtreeCollapsed={collapsedSet.has(node.content.id)}
            onAction={onAction}
            settings={settings}
          />
        );
      }
    }
    for (const child of node.children) collect(child);
  }

  collect(root);
  return <g>{elements}</g>;
}
