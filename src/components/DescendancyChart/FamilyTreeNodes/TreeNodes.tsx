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
import { normalizeGedcomXref } from "@/components/TreeViewer/v2/PersonDetailOverlay/utils";
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

function buildPedigreeGenerationMap(root: PersonNode): Map<string, number> {
  const m = new Map<string, number>();
  function walk(p: PersonNode, g: number) {
    if (p.content._isShadow) return;
    m.set(p.content.id, g);
    const u = getPedigreeParentUnion(p);
    if (u) {
      walk(u.left, g - 1);
      if (u.right) walk(u.right, g - 1);
    }
  }
  walk(root, 0);
  return m;
}

function pedigreeGlobalMinGeneration(genMap: Map<string, number>): number {
  let min = 0;
  for (const v of genMap.values()) min = Math.min(min, v);
  return min;
}

function pedigreeAncestorCollapseMatches(
  collapsePersonId: string | null | undefined,
  nodePersonId: string
): boolean {
  if (collapsePersonId == null || String(collapsePersonId).trim() === "") return false;
  return normalizeGedcomXref(collapsePersonId) === normalizeGedcomXref(nodePersonId);
}

function pedigreePersonHasMultipleFamiliesAsChild(
  personId: string,
  apiMultiFamilyXrefs: string[] | null | undefined,
  parentUnionCount: number
): boolean {
  if (apiMultiFamilyXrefs != null) {
    const pn = normalizeGedcomXref(personId);
    return apiMultiFamilyXrefs.some((x) => normalizeGedcomXref(x) === pn);
  }
  return parentUnionCount > 1;
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
  /** Pedigree / vertical pedigree: build depth is below API cap so "Expand ancestors" can apply. */
  pedigreeHasRoomToExpandDepth?: boolean;
  /** Pedigree API: people (xrefs) who have more than one family as a child — drives "Choose parent family". */
  pedigreeMultiFamilyChildXrefs?: string[] | null;
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
  pedigreeHasRoomToExpandDepth = false,
  pedigreeMultiFamilyChildXrefs = null,
}: TreeNodesProps) {
  const collapsedSet = new Set(viewState?.collapsedSubtrees ?? []);
  const elements: React.ReactNode[] = [];

  const pedigreeGenMap =
    (chartStrategy === "pedigree" || chartStrategy === "vertical_pedigree") && root instanceof PersonNode
      ? buildPedigreeGenerationMap(root)
      : null;
  const pedigreeGlobalMinGen = pedigreeGenMap != null ? pedigreeGlobalMinGeneration(pedigreeGenMap) : 0;

  function collectPedigreePersons(node: PersonNode, seen: Set<string>): void {
    if (node.content._isShadow) return;
    const id = node.content.id;
    if (seen.has(id)) return;
    seen.add(id);
    const parentUnions = getParentUnionsByChild().get(id) ?? [];
    elements.push(
      <PersonNodeView
        key={`p-ped-${id}`}
        cx={node.x}
        y={node.y}
        person={node.content}
        isRoot={node.content.id === rootId}
        hasSpouses={(getUnionsByPerson().get(node.content.id) ?? []).length > 0}
        hasParents={parentUnions.length > 0}
        onlyRoot={!!node.content._onlyRoot}
        isLeaf={node.children.length === 0}
        hasDescendantsInData={(getAllChildrenOf(node.content.id) ?? []).length > 0}
        isSubtreeCollapsed={collapsedSet.has(node.content.id)}
        onAction={onAction}
        onNameClick={onNameClick}
        settings={settings}
        chartStrategy={chartStrategy}
        isMobile={isMobile}
        pedigreeGeneration={pedigreeGenMap?.get(id)}
        pedigreeGlobalMinGen={pedigreeGenMap != null ? pedigreeGlobalMinGen : undefined}
        hasMultipleFamiliesAsChild={pedigreePersonHasMultipleFamiliesAsChild(
          id,
          pedigreeMultiFamilyChildXrefs,
          parentUnions.length
        )}
        pedigreeShowExpandAncestorsAction={
          pedigreeHasRoomToExpandDepth && (pedigreeGenMap?.get(id) ?? 0) === pedigreeGlobalMinGen
        }
        pedigreeIsAncestorCollapseTarget={pedigreeAncestorCollapseMatches(
          viewState?.pedigreeAncestorCollapsePersonId,
          id
        )}
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
