"use client";

import { PERSON_WIDTH, PersonNode, UnionNode, NormalUnionNode } from "@/genealogy-visualization-engine";
import type { ChartNode, ConnectorHelpers } from "@/genealogy-visualization-engine";

const FALLBACK_CONNECTOR = "#9A8F7C";
const STUB = 72;
/** Keep the vertical trunk left of parent cards so lines don’t pierce them top-to-bottom. */
const BUS_MARGIN = 20;
const CONNECTOR_STROKE = { strokeWidth: 1.5, strokeOpacity: 0.85 } as const;

interface PedigreeConnectorLinesProps {
  root: ChartNode;
  connectors?: ConnectorHelpers;
  personHeight?: number;
  connectorStyle?: "classic" | "midline";
  hasPedigreeRootSiblings?: boolean;
  hasPedigreeRootChildren?: boolean;
}

function getParentUnion(p: PersonNode): NormalUnionNode | null {
  if (p.children.length !== 1 || !(p.children[0] instanceof UnionNode)) return null;
  const u = p.children[0];
  return u instanceof NormalUnionNode ? u : null;
}

function rightCenter(p: PersonNode): { x: number; y: number } {
  return { x: p.x + PERSON_WIDTH / 2, y: p.y };
}

/** Midpoint of the card’s left edge (where the trunk meets the card). */
function leftEdgeMid(p: PersonNode): { x: number; y: number } {
  return { x: p.x - PERSON_WIDTH / 2, y: p.y };
}

/** Geometric center of the card (elbow terminates here). */
function cardCenter(p: PersonNode): { x: number; y: number } {
  return { x: p.x, y: p.y };
}

function hasParentUnion(p: PersonNode): boolean {
  return getParentUnion(p) != null;
}

/**
 * LTR pedigree elbows: exit child at right-edge midpoint → vertical bus **left of**
 * both parent cards → horizontal into each parent’s **left-edge midpoint**, then to center.
 */
export function PedigreeConnectorLines({
  root,
  connectorStyle = "classic",
  hasPedigreeRootSiblings = false,
  hasPedigreeRootChildren = false,
}: PedigreeConnectorLinesProps) {
  const stroke = "var(--tree-connector, " + FALLBACK_CONNECTOR + ")";
  const lines: React.ReactNode[] = [];
  let key = 0;

  function addPolyline(points: number[], dash = "none") {
    if (points.length < 4) return;
    lines.push(
      <polyline
        key={`pc-${key++}`}
        fill="none"
        points={points.join(" ")}
        stroke={stroke}
        strokeDasharray={dash}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...CONNECTOR_STROKE}
      />
    );
  }

  function drawFromChild(child: PersonNode): void {
    const u = getParentUnion(child);
    if (!u) return;

    const useMidlineAtThisNode =
      connectorStyle === "midline" &&
      !((hasPedigreeRootSiblings || hasPedigreeRootChildren) && child === root);
    const { x: rx, y: ry } = useMidlineAtThisNode ? cardCenter(child) : rightCenter(child);
    const leftA = u.left.x - PERSON_WIDTH / 2;
    const leftB = u.right ? u.right.x - PERSON_WIDTH / 2 : leftA;
    const minParentLeft = Math.min(leftA, leftB);
    const maxBusX = minParentLeft - BUS_MARGIN;
    const preferredBusX = rx + STUB;
    const junctionX = Math.min(preferredBusX, maxBusX);
    const busX = junctionX < rx ? rx : junctionX;

    const leftEdge = leftEdgeMid(u.left);
    const leftTarget =
      connectorStyle === "midline" && hasParentUnion(u.left)
        ? cardCenter(u.left)
        : leftEdge;
    // Child → bus → left parent: one polyline for rounded elbows.
    addPolyline([rx, ry, busX, ry, busX, leftTarget.y, leftTarget.x, leftTarget.y]);

    if (u.right) {
      const re = leftEdgeMid(u.right);
      const rightTarget =
        connectorStyle === "midline" && hasParentUnion(u.right)
          ? cardCenter(u.right)
          : re;
      // End exactly at the trunk intersection so the branch does not overshoot past the vertical line.
      addPolyline([busX, ry, busX, rightTarget.y, rightTarget.x, rightTarget.y]);
    }

    drawFromChild(u.left);
    if (u.right) drawFromChild(u.right);
  }

  if (root instanceof PersonNode) {
    drawFromChild(root);
  }

  return <g>{lines}</g>;
}
