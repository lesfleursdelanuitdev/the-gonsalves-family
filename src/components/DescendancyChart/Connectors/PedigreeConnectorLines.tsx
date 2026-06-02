"use client";

import { PERSON_WIDTH, PERSON_HEIGHT, PersonNode, UnionNode, NormalUnionNode } from "@/genealogy-visualization-engine";
import type { ChartNode, ConnectorHelpers } from "@/genealogy-visualization-engine";

const FALLBACK_CONNECTOR = "#9A8F7C";
const CONNECTOR_STROKE = { strokeWidth: 1.5, strokeOpacity: 0.85 } as const;

interface PedigreeConnectorLinesProps {
  root: ChartNode;
  connectors?: ConnectorHelpers;
  personHeight?: number;
  personWidth?: number;
  connectorStyle?: "classic" | "midline";
  hasPedigreeRootSiblings?: boolean;
  hasPedigreeRootChildren?: boolean;
}

function getParentUnion(p: PersonNode): NormalUnionNode | null {
  if (p.children.length !== 1 || !(p.children[0] instanceof UnionNode)) return null;
  const u = p.children[0];
  return u instanceof NormalUnionNode ? u : null;
}

/**
 * LTR pedigree connectors.
 *
 * Each parent gets an L-shaped connector:
 *   - Father (above child): exits child's top-edge midpoint, goes up to father's y-level,
 *     then right to father's left-edge midpoint.
 *   - Mother (below child): exits child's bottom-edge midpoint, goes down to mother's y-level,
 *     then right to mother's left-edge midpoint.
 *
 * This keeps the vertical segment in the vertical gap between the child and parent cards,
 * and allows parent cards to sit above/below the child rather than strictly to its right,
 * producing a more compact chart horizontally.
 */
export function PedigreeConnectorLines({
  root,
  personHeight,
  personWidth,
}: PedigreeConnectorLinesProps) {
  const ph = personHeight ?? PERSON_HEIGHT;
  const pw = personWidth ?? PERSON_WIDTH;
  const stroke = "var(--tree-connector, " + FALLBACK_CONNECTOR + ")";
  const lines: React.ReactNode[] = [];
  let key = 0;

  function addPolyline(points: number[]) {
    if (points.length < 4) return;
    lines.push(
      <polyline
        key={`pc-${key++}`}
        fill="none"
        points={points.join(" ")}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...CONNECTOR_STROKE}
      />
    );
  }

  function drawFromChild(child: PersonNode): void {
    const u = getParentUnion(child);
    if (!u) return;

    // Father branch: exit top-edge midpoint → up to father's y → right to father's left edge
    addPolyline([child.x, child.y - ph / 2, child.x, u.left.y, u.left.x - pw / 2, u.left.y]);

    // Mother branch: exit bottom-edge midpoint → down to mother's y → right to mother's left edge
    if (u.right) {
      addPolyline([child.x, child.y + ph / 2, child.x, u.right.y, u.right.x - pw / 2, u.right.y]);
    }

    drawFromChild(u.left);
    if (u.right) drawFromChild(u.right);
  }

  if (root instanceof PersonNode) {
    drawFromChild(root);
  }

  return <g>{lines}</g>;
}
