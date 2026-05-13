"use client";

import { PERSON_HEIGHT, PersonNode, UnionNode, NormalUnionNode } from "@/genealogy-visualization-engine";
import type { ChartNode, ConnectorHelpers } from "@/genealogy-visualization-engine";

const FALLBACK_CONNECTOR = "#9A8F7C";
const STUB = 56;
const BUS_MARGIN = 16;
/** SVG stroke-linejoin rounds orthogonal corners when points share one polyline. */
const CONNECTOR_STROKE = { strokeWidth: 1.5, strokeOpacity: 0.85 } as const;

interface VerticalPedigreeConnectorLinesProps {
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

/**
 * Vertical pedigree: exit child at **top** center, horizontal bus between generations,
 * then vertical segments into each parent’s **bottom** center and up to the card center.
 */
export function VerticalPedigreeConnectorLines({
  root,
  personHeight: personHeightProp,
  connectorStyle = "classic",
  hasPedigreeRootSiblings = false,
  hasPedigreeRootChildren = false,
}: VerticalPedigreeConnectorLinesProps) {
  const ph = personHeightProp ?? PERSON_HEIGHT;
  const stroke = "var(--tree-connector, " + FALLBACK_CONNECTOR + ")";
  const lines: React.ReactNode[] = [];
  let key = 0;

  function addPolyline(points: number[], dash = "none") {
    if (points.length < 4) return;
    lines.push(
      <polyline
        key={`vpc-${key++}`}
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

    const startX = child.x;
    const useMidlineAtThisNode =
      connectorStyle === "midline" &&
      !((hasPedigreeRootSiblings || hasPedigreeRootChildren) && child === root);
    const startY = useMidlineAtThisNode ? child.y : child.y - ph / 2;

    const leftBottom = u.left.y + ph / 2;
    const rightBottom = u.right ? u.right.y + ph / 2 : leftBottom;
    const maxParentBottom = Math.max(leftBottom, rightBottom);

    const leftTop = u.left.y - ph / 2;
    const rightTop = u.right ? u.right.y - ph / 2 : leftTop;
    const minParentTop = Math.min(leftTop, rightTop);

    let busY = startY - STUB;
    busY = Math.min(busY, minParentTop - BUS_MARGIN);
    busY = Math.max(busY, maxParentBottom + BUS_MARGIN);
    if (busY >= startY - 2) busY = startY - 4;

    const xs = [child.x, u.left.x, ...(u.right ? [u.right.x] : [])];
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    // Child trunk + horizontal bus: one polyline so the T-junction gets rounded joins.
    if (minX !== maxX) {
      addPolyline([startX, startY, startX, busY, minX, busY, maxX, busY]);
    } else {
      addPolyline([startX, startY, startX, busY, minX, busY]);
    }

    function toParent(p: PersonNode): void {
      const hasParents = getParentUnion(p) != null;
      const targetY = connectorStyle === "midline" && hasParents ? p.y : p.y + ph / 2;
      addPolyline([p.x, busY, p.x, targetY]);
    }
    toParent(u.left);
    if (u.right) toParent(u.right);

    drawFromChild(u.left);
    if (u.right) drawFromChild(u.right);
  }

  if (root instanceof PersonNode) {
    drawFromChild(root);
  }

  return <g>{lines}</g>;
}
