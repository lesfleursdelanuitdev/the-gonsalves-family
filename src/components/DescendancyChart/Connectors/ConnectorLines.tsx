"use client";

import {
  defaultConnectors,
  PersonNode,
  UnionNode,
  LinkedParentNode,
  SiblingAdoptiveUnionNode,
  CatchAllNode,
  NormalUnionNode,
  getUnionById,
  DIAMOND_SIZE,
} from "@/genealogy-visualization-engine";
import type { ChartNode, ConnectorHelpers } from "@/genealogy-visualization-engine";

function getUnionConnectorColor(node: UnionNode): string | undefined {
  if (node instanceof CatchAllNode) return node.connectorColor;
  if (node instanceof SiblingAdoptiveUnionNode) return node.connectorColor;
  if (node instanceof NormalUnionNode) return node.connectorColor;
  return undefined;
}

/** Fallback colors when CSS variables are not available (e.g. no cascade). Match light-theme --text-subtle / --text-muted. */
const FALLBACK_CONNECTOR = "#9A8F7C";
const FALLBACK_LINKED = "#6F675A";

interface ConnectorLinesProps {
  root: ChartNode;
  /** When provided (e.g. from builder.getCurrentStrategy()?.connectors), use for geometry. Else use default (descendancy). */
  connectors?: ConnectorHelpers;
}

export function ConnectorLines({ root, connectors: connectorsProp }: ConnectorLinesProps) {
  const conn = connectorsProp ?? defaultConnectors;
  const strokeConnector = "var(--tree-connector, " + FALLBACK_CONNECTOR + ")";
  const strokeLinked = "var(--tree-linked, " + FALLBACK_LINKED + ")";
  const lines: React.ReactNode[] = [];

  const posMap = new Map<string, ChartNode>();
  function buildPosMap(node: ChartNode) {
    if (node instanceof PersonNode && !node.content._isShadow) {
      posMap.set(node.content.id, node);
    }
    for (const c of node.children) buildPosMap(c);
  }
  buildPosMap(root);

  function collect(node: ChartNode) {
    if (node instanceof LinkedParentNode) {
      const linkedUnion = getUnionById().get(node.linkedUnionId);
      if (linkedUnion) {
        const fromY = node.y + DIAMOND_SIZE;
        for (const { id: childId } of linkedUnion.children) {
          const childNode = posMap.get(childId);
          if (!childNode) continue;
          const cx = conn.incomingX(childNode);
          const toY = conn.incomingY(childNode);
          const midY = fromY + (toY - fromY) / 2;
          const uid = `${node.linkedUnionId}-${childId}`;
          lines.push(
            <line
              key={`linked-v-${uid}`}
              x1={node.x}
              y1={fromY}
              x2={node.x}
              y2={midY}
              stroke={strokeLinked}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              strokeOpacity={0.8}
            />
          );
          lines.push(
            <line
              key={`linked-h-${uid}`}
              x1={node.x}
              y1={midY}
              x2={cx}
              y2={midY}
              stroke={strokeLinked}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              strokeOpacity={0.8}
            />
          );
          lines.push(
            <line
              key={`linked-vc-${uid}`}
              x1={cx}
              y1={midY}
              x2={cx}
              y2={toY}
              stroke={strokeLinked}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              strokeOpacity={0.8}
            />
          );
        }
      }
      return;
    }

    if (node instanceof SiblingAdoptiveUnionNode) {
      const sibNode = posMap.get(node.siblingPersonId);
      const color = node.connectorColor ?? strokeLinked;
      if (sibNode) {
        const fromY = node.y + DIAMOND_SIZE;
        const cx = conn.incomingX(sibNode);
        const toY = conn.incomingY(sibNode);
        const midY = fromY + (toY - fromY) / 2;
        const uid = `sib-${node.linkedUnionId ?? `${node.x}-${node.y}`}-${node.siblingPersonId}`;
        lines.push(
          <line
            key={`${uid}-v1`}
            x1={node.x}
            y1={fromY}
            x2={node.x}
            y2={midY}
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="6 3"
            strokeOpacity={0.8}
          />
        );
        lines.push(
          <line
            key={`${uid}-h`}
            x1={node.x}
            y1={midY}
            x2={cx}
            y2={midY}
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="6 3"
            strokeOpacity={0.8}
          />
        );
        lines.push(
          <line
            key={`${uid}-v2`}
            x1={cx}
            y1={midY}
            x2={cx}
            y2={toY}
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="6 3"
            strokeOpacity={0.8}
          />
        );
      }
    }

    if (node.children.length === 0) return;

    if (node instanceof PersonNode && (conn.isContainer?.(node) ?? false)) {
      for (const child of node.children) collect(child);
      return;
    }

    const strokeColor =
      node instanceof UnionNode && getUnionConnectorColor(node)
        ? getUnionConnectorColor(node)!
        : strokeConnector;
    const fromY = conn.outgoingY(node);
    const toY = conn.incomingY(node.children[0]);
    // For union nodes, midY (where the horizontal runs) is computed from the card
    // bottom rather than the diamond tip so the gap below the cards matches the
    // single-person (spouse-closed) case.  For all other nodes the existing
    // behaviour (halfway between fromY and toY) is preserved.
    const cardBottomY = node instanceof UnionNode
      ? 2 * node.y - conn.incomingY(node)
      : fromY;
    const midY = cardBottomY + (toY - cardBottomY) / 2;
    const visibleChildren = node.children.filter(conn.hasIncomingConnector);
    const leftX = conn.incomingX(node.children[0]);
    const rightX = conn.incomingX(node.children[node.children.length - 1]);

    lines.push(
      <line
        key={`v-${node.x}-${node.y}`}
        x1={node.x}
        y1={fromY}
        x2={node.x}
        y2={midY}
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeOpacity={0.8}
      />
    );

    if (leftX !== rightX || Math.abs(node.x - leftX) > 0.001) {
      lines.push(
        <line
          key={`h-${node.x}-${node.y}`}
          x1={Math.min(node.x, leftX)}
          y1={midY}
          x2={Math.max(node.x, rightX)}
          y2={midY}
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeOpacity={0.8}
        />
      );
    }

    for (const child of node.children) {
      const cx = conn.incomingX(child);
      const cy = conn.incomingY(child);
      const childStroke =
        child instanceof UnionNode && getUnionConnectorColor(child)
          ? getUnionConnectorColor(child)!
          : strokeColor;
      if (conn.hasIncomingConnector(child)) {
        lines.push(
          <line
            key={`vc-${child.x}-${child.y}`}
            x1={cx}
            y1={midY}
            x2={cx}
            y2={cy}
            stroke={childStroke}
            strokeWidth={1.5}
            strokeOpacity={0.8}
          />
        );
      } else if (child instanceof CatchAllNode) {
        lines.push(
          <line
            key={`vc-catchall-${child.x}-${child.y}`}
            x1={cx}
            y1={midY}
            x2={cx}
            y2={cy}
            stroke={childStroke}
            strokeWidth={1.5}
            strokeOpacity={0.8}
          />
        );
      }
      collect(child);
    }
  }

  collect(root);
  return <g>{lines}</g>;
}
