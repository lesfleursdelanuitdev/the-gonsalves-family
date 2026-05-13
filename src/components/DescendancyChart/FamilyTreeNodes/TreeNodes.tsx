"use client";

import type { ComponentType } from "react";
import type { ChartNode, ChartViewStrategyName } from "@/genealogy-visualization-engine";
import {
  PERSON_WIDTH,
  getUnionsByPerson,
  getParentUnionsByChild,
  getAllChildrenOf,
  UnionNode,
  NormalUnionNode,
  PersonNode,
} from "@/genealogy-visualization-engine";
import type { PersonCardAction, ViewState } from "@/genealogy-visualization-engine";
import type { DescendancyPerson } from "@/genealogy-visualization-engine";
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

export type PedigreeRootSiblingNode = {
  xref: string;
  firstName: string;
  lastName: string;
  gender?: string | null;
};

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
  /** Effective card height from current display settings. */
  personHeight?: number;
  /** Optional root sibling cards (pedigree-only). Rendered around root in the same generation row/column. */
  pedigreeRootSiblings?: PedigreeRootSiblingNode[] | null;
  /** Optional root children cards (pedigree-only descendants peek). */
  pedigreeRootChildren?: PedigreeRootSiblingNode[] | null;
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
  personHeight = 104,
  pedigreeRootSiblings = null,
  pedigreeRootChildren = null,
}: TreeNodesProps) {
  const collapsedSet = new Set(viewState?.collapsedSubtrees ?? []);
  const elements: React.ReactNode[] = [];

  const pedigreeGenMap =
    (chartStrategy === "pedigree" || chartStrategy === "vertical_pedigree") && root instanceof PersonNode
      ? buildPedigreeGenerationMap(root)
      : null;
  const pedigreeGlobalMinGen = pedigreeGenMap != null ? pedigreeGlobalMinGeneration(pedigreeGenMap) : 0;
  const pedigreeRootSiblingsExpanded = Boolean(pedigreeRootSiblings?.length);
  const pedigreeRootChildrenExpanded = Boolean(pedigreeRootChildren?.length);

  function renderPedigreeRootSiblings(rootNode: PersonNode): void {
    const isHorizontalPedigree = chartStrategy === "pedigree";
    const isVerticalPedigree = chartStrategy === "vertical_pedigree";
    if ((!isHorizontalPedigree && !isVerticalPedigree) || !Array.isArray(pedigreeRootSiblings) || pedigreeRootSiblings.length === 0) {
      return;
    }
    const lineStroke = "var(--tree-connector, #9A8F7C)";
    const siblingPositions = pedigreeRootSiblings.map((sib, idx) => {
      const band = Math.floor(idx / 2) + 1;
      const sign = idx % 2 === 0 ? -1 : 1;
      if (isHorizontalPedigree) {
        const rowStep = personHeight + 24;
        const y = rootNode.y + sign * band * rowStep; // Above first, then below.
        return { ...sib, x: rootNode.x, y };
      }
      const colStep = PERSON_WIDTH + 28;
      const x = rootNode.x + sign * band * colStep; // Left first, then right.
      return { ...sib, x, y: rootNode.y };
    });

    if (isHorizontalPedigree) {
      const allRows = [rootNode.y, ...siblingPositions.map((s) => s.y)].sort((a, b) => a - b);
      for (let i = 0; i < allRows.length - 1; i += 1) {
        const upperY = allRows[i]!;
        const lowerY = allRows[i + 1]!;
        elements.push(
          <line
            key={`ped-root-sib-line-v-${i}`}
            x1={rootNode.x}
            y1={upperY + personHeight / 2}
            x2={rootNode.x}
            y2={lowerY - personHeight / 2}
            stroke={lineStroke}
            strokeWidth={1.5}
            strokeOpacity={0.85}
            strokeLinecap="round"
          />
        );
      }
    } else {
      const allCols = [rootNode.x, ...siblingPositions.map((s) => s.x)].sort((a, b) => a - b);
      for (let i = 0; i < allCols.length - 1; i += 1) {
        const leftX = allCols[i]!;
        const rightX = allCols[i + 1]!;
        elements.push(
          <line
            key={`ped-root-sib-line-h-${i}`}
            x1={leftX + PERSON_WIDTH / 2}
            y1={rootNode.y}
            x2={rightX - PERSON_WIDTH / 2}
            y2={rootNode.y}
            stroke={lineStroke}
            strokeWidth={1.5}
            strokeOpacity={0.85}
            strokeLinecap="round"
          />
        );
      }
    }

    for (const sib of siblingPositions) {
      const p: DescendancyPerson = {
        id: sib.xref,
        xref: sib.xref,
        uuid: null,
        firstName: sib.firstName,
        lastName: sib.lastName,
        birthYear: null,
        deathYear: null,
        photoUrl: null,
        gender: sib.gender ?? null,
      };
      elements.push(
        <PersonNodeView
          key={`p-ped-root-sib-${sib.xref}`}
          cx={sib.x}
          y={sib.y}
          person={p}
          isRoot={false}
          hasSpouses={false}
          hasParents={true}
          onlyRoot={false}
          isLeaf={true}
          hasDescendantsInData={false}
          isSubtreeCollapsed={false}
          onAction={onAction}
          onNameClick={onNameClick}
          settings={settings}
          chartStrategy={chartStrategy}
          isMobile={isMobile}
          pedigreeGeneration={0}
          pedigreeGlobalMinGen={0}
          hasMultipleFamiliesAsChild={false}
          pedigreeShowExpandAncestorsAction={false}
          pedigreeIsAncestorCollapseTarget={false}
        />
      );
    }
  }

  function renderPedigreeRootChildren(rootNode: PersonNode): void {
    const isHorizontalPedigree = chartStrategy === "pedigree";
    const isVerticalPedigree = chartStrategy === "vertical_pedigree";
    if ((!isHorizontalPedigree && !isVerticalPedigree) || !Array.isArray(pedigreeRootChildren) || pedigreeRootChildren.length === 0) {
      return;
    }
    const lineStroke = "var(--tree-connector, #9A8F7C)";
    const childPositions = pedigreeRootChildren.map((child, idx, arr) => {
      if (isHorizontalPedigree) {
        const childX = rootNode.x - (PERSON_WIDTH + 92);
        const y = rootNode.y + (idx - (arr.length - 1) / 2) * (personHeight + 16);
        return { ...child, x: childX, y };
      }
      const childY = rootNode.y + personHeight + 32;
      const x = rootNode.x + (idx - (arr.length - 1) / 2) * (PERSON_WIDTH + 18);
      return { ...child, x, y: childY };
    });

    if (isHorizontalPedigree) {
      const ys = childPositions.map((c) => c.y).sort((a, b) => a - b);
      const trunkX = childPositions[0]!.x + PERSON_WIDTH / 2 + 18;
      const rootConnectorX = rootNode.x - PERSON_WIDTH / 2; // Card edge facing the descendants column.
      const childConnectorX = childPositions[0]!.x + PERSON_WIDTH / 2;

      elements.push(
        <line
          key="ped-root-children-root-link-h"
          x1={rootConnectorX}
          y1={rootNode.y}
          x2={trunkX}
          y2={rootNode.y}
          stroke={lineStroke}
          strokeWidth={1.5}
          strokeOpacity={0.85}
          strokeLinecap="round"
        />
      );

      if (ys.length >= 2) {
        elements.push(
          <line
            key="ped-root-children-trunk-v"
            x1={trunkX}
            y1={ys[0]!}
            x2={trunkX}
            y2={ys[ys.length - 1]!}
            stroke={lineStroke}
            strokeWidth={1.5}
            strokeOpacity={0.85}
            strokeLinecap="round"
          />
        );
      }
      for (const c of childPositions) {
        elements.push(
          <line
            key={`ped-root-child-link-h-${c.xref}`}
            x1={childConnectorX}
            y1={c.y}
            x2={trunkX}
            y2={c.y}
            stroke={lineStroke}
            strokeWidth={1.5}
            strokeOpacity={0.85}
            strokeLinecap="round"
          />
        );
      }
    } else {
      const xs = childPositions.map((c) => c.x).sort((a, b) => a - b);
      const rootConnectorY = rootNode.y + personHeight / 2;
      const childConnectorY = childPositions[0]!.y - personHeight / 2;
      const trunkY = childConnectorY - 18;
      elements.push(
        <line
          key="ped-root-children-root-link-v"
          x1={rootNode.x}
          y1={rootConnectorY}
          x2={rootNode.x}
          y2={trunkY}
          stroke={lineStroke}
          strokeWidth={1.5}
          strokeOpacity={0.85}
          strokeLinecap="round"
        />
      );
      if (xs.length >= 2) {
        elements.push(
          <line
            key="ped-root-children-trunk-h"
            x1={xs[0]!}
            y1={trunkY}
            x2={xs[xs.length - 1]!}
            y2={trunkY}
            stroke={lineStroke}
            strokeWidth={1.5}
            strokeOpacity={0.85}
            strokeLinecap="round"
          />
        );
      }
      for (const c of childPositions) {
        elements.push(
          <line
            key={`ped-root-child-link-v-${c.xref}`}
            x1={c.x}
            y1={childConnectorY}
            x2={c.x}
            y2={trunkY}
            stroke={lineStroke}
            strokeWidth={1.5}
            strokeOpacity={0.85}
            strokeLinecap="round"
          />
        );
      }
    }

    for (const c of childPositions) {
      const p: DescendancyPerson = {
        id: c.xref,
        xref: c.xref,
        uuid: null,
        firstName: c.firstName,
        lastName: c.lastName,
        birthYear: null,
        deathYear: null,
        photoUrl: null,
        gender: c.gender ?? null,
      };
      elements.push(
        <PersonNodeView
          key={`p-ped-root-child-${c.xref}`}
          cx={c.x}
          y={c.y}
          person={p}
          isRoot={false}
          hasSpouses={false}
          hasParents={true}
          onlyRoot={false}
          isLeaf={true}
          hasDescendantsInData={false}
          isSubtreeCollapsed={false}
          onAction={onAction}
          onNameClick={onNameClick}
          settings={settings}
          chartStrategy={chartStrategy}
          isMobile={isMobile}
          pedigreeGeneration={0}
          pedigreeGlobalMinGen={0}
          hasMultipleFamiliesAsChild={false}
          pedigreeShowExpandAncestorsAction={false}
          pedigreeIsAncestorCollapseTarget={false}
        />
      );
    }
  }

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
        pedigreeRootSiblingsExpanded={node.content.id === rootId ? pedigreeRootSiblingsExpanded : false}
        pedigreeRootChildrenExpanded={node.content.id === rootId ? pedigreeRootChildrenExpanded : false}
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
    renderPedigreeRootSiblings(root);
    renderPedigreeRootChildren(root);
    collectPedigreePersons(root, new Set());
  } else {
    collect(root);
  }
  return <g>{elements}</g>;
}
