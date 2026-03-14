"use client";

import {
  DIAMOND_SIZE,
  getUnionsByPerson,
  getParentUnionsByChild,
  PERSON_WIDTH,
  CONNECTOR_WIDTH,
  NormalUnionNode,
  CatchAllNode,
  LinkedParentNode,
  SiblingAdoptiveUnionNode,
} from "@/descendancy-chart";
import type { UnionNode } from "@/descendancy-chart";
import { PersonCard } from "./PersonNodeView";
import type { PersonCardAction } from "@/descendancy-chart";
import type { PersonCardSettings } from "./PersonNodeView";
import type { ChartSettings } from "./TreeNodes";

export interface UnionRowProps {
  node: UnionNode;
  rootId: string;
  onAction?: (action: PersonCardAction, personId: string) => void;
  settings?: ChartSettings;
}

/** Fallbacks so diamond and lines stay visible when CSS variables don't cascade (e.g. tree-viewer-test). */
const FALLBACK_TREE_ROOT = "#1a3d2a";
const FALLBACK_TREE_JOIN = "#8F7740";
const FALLBACK_TREE_TEXT_SUBTLE = "#9A8F7C";
const FALLBACK_TREE_LINKED = "#6F675A";
const FALLBACK_TREE_CONNECTOR = "#9A8F7C";

function getDiamondColor(node: UnionNode): string {
  if (node instanceof NormalUnionNode)
    return node._isPrimary ? `var(--tree-root, ${FALLBACK_TREE_ROOT})` : `var(--tree-join, ${FALLBACK_TREE_JOIN})`;
  if (node instanceof CatchAllNode) return node.connectorColor ?? `var(--tree-text-subtle, ${FALLBACK_TREE_TEXT_SUBTLE})`;
  if (node instanceof LinkedParentNode) return `var(--tree-linked, ${FALLBACK_TREE_LINKED})`;
  if (node instanceof SiblingAdoptiveUnionNode) return node.connectorColor ?? FALLBACK_TREE_TEXT_SUBTLE;
  return `var(--tree-text-subtle, ${FALLBACK_TREE_TEXT_SUBTLE})`;
}

function getDiamondGlow(node: UnionNode): string {
  if (node instanceof NormalUnionNode)
    return node._isPrimary ? `var(--tree-root, ${FALLBACK_TREE_ROOT})` : `var(--tree-join, ${FALLBACK_TREE_JOIN})`;
  if (node instanceof CatchAllNode)
    return node.connectorColor ?? `var(--tree-text-subtle, ${FALLBACK_TREE_TEXT_SUBTLE})`;
  if (node instanceof LinkedParentNode) return `var(--tree-linked, ${FALLBACK_TREE_LINKED})`;
  if (node instanceof SiblingAdoptiveUnionNode) return node.connectorColor ?? FALLBACK_TREE_TEXT_SUBTLE;
  return `var(--tree-text-subtle, ${FALLBACK_TREE_TEXT_SUBTLE})`;
}

function getLineStroke(node: UnionNode): string {
  if (node instanceof NormalUnionNode) return `var(--tree-connector, ${FALLBACK_TREE_CONNECTOR})`;
  if (node instanceof CatchAllNode) return node.connectorColor ?? `var(--tree-text-subtle, ${FALLBACK_TREE_TEXT_SUBTLE})`;
  if (node instanceof LinkedParentNode) return `var(--tree-linked, ${FALLBACK_TREE_LINKED})`;
  if (node instanceof SiblingAdoptiveUnionNode) return node.connectorColor ?? FALLBACK_TREE_TEXT_SUBTLE;
  return `var(--tree-text-subtle, ${FALLBACK_TREE_TEXT_SUBTLE})`;
}

function showLeftCard(node: UnionNode): boolean {
  return (
    (node instanceof NormalUnionNode && node._isPrimary) ||
    node instanceof LinkedParentNode ||
    node instanceof SiblingAdoptiveUnionNode
  );
}

function isDashedLine(node: UnionNode): boolean {
  return node instanceof LinkedParentNode || node instanceof SiblingAdoptiveUnionNode;
}

/**
 * Union row: left card, line, diamond, line, right card.
 * left.x = node.x - CONNECTOR_WIDTH/2 - PERSON_WIDTH/2, right.x = node.x + CONNECTOR_WIDTH/2 + PERSON_WIDTH/2.
 */
export function UnionRow({ node, rootId, onAction, settings }: UnionRowProps) {
  const { x, y } = node;
  const leftCX = x - CONNECTOR_WIDTH / 2 - PERSON_WIDTH / 2;
  const rightCX = x + CONNECTOR_WIDTH / 2 + PERSON_WIDTH / 2;
  const diamondColor = getDiamondColor(node);
  const diamondGlow = getDiamondGlow(node);
  const lineStroke = getLineStroke(node);
  const lineDash = isDashedLine(node) ? "6 3" : "none";

  return (
    <g>
      {showLeftCard(node) && (
        <>
          <PersonCard
            cx={leftCX}
            y={y}
            person={node.left.content}
            isRoot={node.left.content.id === rootId}
            isLinkedSpouse={isDashedLine(node) && !!node.left.content._isLinkedSpouse}
            hasSpouses={(getUnionsByPerson().get(node.left.content.id) ?? []).length > 0}
            hasParents={(getParentUnionsByChild().get(node.left.content.id) ?? []).length > 0}
            onlyRoot={!!node.left.content._onlyRoot}
            isLeaf={node.children.length === 0}
            onAction={onAction}
            settings={settings as PersonCardSettings | undefined}
          />
          <line
            x1={leftCX + PERSON_WIDTH / 2}
            y1={y}
            x2={x - DIAMOND_SIZE}
            y2={y}
            stroke={lineStroke}
            strokeWidth={1.5}
            strokeDasharray={lineDash}
          />
        </>
      )}

      <polygon
        points={`${x},${y - DIAMOND_SIZE} ${x + DIAMOND_SIZE},${y} ${x},${y + DIAMOND_SIZE} ${x - DIAMOND_SIZE},${y}`}
        fill={diamondColor}
        style={{ filter: `drop-shadow(0 0 5px var(--tree-text-subtle, ${FALLBACK_TREE_TEXT_SUBTLE}))` }}
      />

      {node.right && (
        <>
          <line
            x1={x + DIAMOND_SIZE}
            y1={y}
            x2={rightCX - PERSON_WIDTH / 2}
            y2={y}
            stroke={lineStroke}
            strokeWidth={1.5}
            strokeDasharray={lineDash}
          />
          <PersonCard
            cx={rightCX}
            y={y}
            person={node.right.content}
            isRoot={node.right.content.id === rootId}
            isSpouse={!isDashedLine(node)}
            isLinkedSpouse={isDashedLine(node)}
            hasSpouses={(getUnionsByPerson().get(node.right.content.id) ?? []).length > 0}
            hasParents={(getParentUnionsByChild().get(node.right.content.id) ?? []).length > 0}
            onlyRoot={!!node.right.content._onlyRoot}
            isLeaf={node.children.length === 0}
            onAction={onAction}
            settings={settings as PersonCardSettings | undefined}
          />
        </>
      )}
    </g>
  );
}
