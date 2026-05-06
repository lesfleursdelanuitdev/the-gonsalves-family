"use client";

import type { ComponentType } from "react";
import type { ChartNode, ChartViewStrategyName } from "@/genealogy-visualization-engine";
import {
  getUnionsByPerson,
  getParentUnionsByChild,
  getAllChildrenOf,
  UnionNode,
  NormalUnionNode,
  PersonNode,
} from "@/genealogy-visualization-engine";
import type { PersonCardAction, ViewState } from "@/genealogy-visualization-engine";
import type { PersonCardLayout } from "@/lib/person-card-layout";
import { PersonCard } from "./PersonNodeView";
import { UnionRow } from "./UnionNodeView";
import type { PersonCardProps } from "./PersonNodeView";
import type { UnionRowProps } from "./UnionNodeView";

export interface ChartSettings {
  showDates?: boolean;
  showPhotos?: boolean;
  showUnknown?: boolean;
  showCardActionIcons?: boolean;
  personCardLayout?: PersonCardLayout;
}

export type OnNameClick = (person: { name: string; xref: string; uuid: string | null }) => void;

function getPedigreeParentUnion(p: PersonNode): NormalUnionNode | null {
  if (p.children.length !== 1 || !(p.children[0] instanceof UnionNode)) return null;
  const u = p.children[0];
  return u instanceof NormalUnionNode ? u : null;
}

interface TreeNodesProps {
  root: ChartNode;
  rootId: string;
  onAction?: (action: PersonCardAction, personId: string) => void;
  /** When provided, person names are clickable and this is called with name, xref, uuid. */
  onNameClick?: OnNameClick;
  settings?: ChartSettings;
  /** For collapse/expand subtree: which person IDs have collapsed subtrees. */
  viewState?: ViewState;
  /** When provided (e.g. from TreeNodeViewFactory), use instead of PersonCard. */
  personNodeView?: ComponentType<PersonCardProps>;
  /** When provided (e.g. from TreeNodeViewFactory), use instead of UnionRow. */
  unionNodeView?: ComponentType<UnionRowProps>;
  /** Pedigree mode flattens persons (union rows are structural-only). */
  chartStrategy?: ChartViewStrategyName;
  isMobile?: boolean;
}

export function TreeNodes({
  root,
  rootId,
  onAction,
  onNameClick,
  settings,
  viewState,
  personNodeView: PersonNodeView = PersonCard,
  unionNodeView: UnionNodeView = UnionRow,
  chartStrategy = "descendancy",
  isMobile = false,
}: TreeNodesProps) {
  const collapsedSet = new Set(viewState?.collapsedSubtrees ?? []);
  const elements: React.ReactNode[] = [];

  function collectPedigreePersons(node: PersonNode, seen: Set<string>): void {
    if (node.content._isShadow) return;
    const id = node.content.id;
    if (seen.has(id)) return;
    seen.add(id);
    elements.push(
      <PersonNodeView
        key={`p-ped-${id}`}
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
        onNameClick={onNameClick}
        settings={settings}
        chartStrategy={chartStrategy}
        isMobile={isMobile}
      />
    );
    const u = getPedigreeParentUnion(node);
    if (!u) return;
    collectPedigreePersons(u.left, seen);
    if (u.right) collectPedigreePersons(u.right, seen);
  }

  function collect(node: ChartNode) {
    if (node instanceof UnionNode) {
      elements.push(
        <UnionNodeView
          key={`u-${node.x}-${node.y}`}
          node={node}
          rootId={rootId}
          onAction={onAction}
          onNameClick={onNameClick}
          settings={settings}
          viewState={viewState}
          chartStrategy={chartStrategy}
          isMobile={isMobile}
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
            onNameClick={onNameClick}
            settings={settings}
            chartStrategy={chartStrategy}
            isMobile={isMobile}
          />
        );
      }
    }
    for (const child of node.children) collect(child);
  }

  if ((chartStrategy === "pedigree" || chartStrategy === "vertical_pedigree") && root instanceof PersonNode) {
    collectPedigreePersons(root, new Set());
  } else {
    collect(root);
  }
  return <g>{elements}</g>;
}
