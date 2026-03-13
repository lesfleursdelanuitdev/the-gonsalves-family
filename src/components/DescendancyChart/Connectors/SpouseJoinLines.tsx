"use client";

import type { ChartNode } from "@/descendancy-chart";
import { UnionNode } from "@/descendancy-chart";

interface SpouseJoinLinesProps {
  root: ChartNode;
}

export function SpouseJoinLines({ root }: SpouseJoinLinesProps) {
  /** Each row = direct children of some node that are union nodes. We draw a horizontal line across the row. */
  const rows: ChartNode[][] = [];

  function collect(node: ChartNode) {
    const unionChildren = node.children.filter((c): c is UnionNode => c instanceof UnionNode);
    if (unionChildren.length >= 2) rows.push(unionChildren);
    for (const child of node.children) collect(child);
  }
  collect(root);

  const lines: React.ReactNode[] = [];
  rows.forEach((row, i) => {
    const sorted = [...row].sort((a, b) => a.x - b.x);
    const x1 = sorted[0].x;
    const x2 = sorted[sorted.length - 1].x;
    const y = sorted[0].y;
    if (Math.abs(x2 - x1) < 0.001) return;
    lines.push(
      <line
        key={`join-row-${i}`}
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="var(--tree-join)"
        strokeWidth={1.5}
        strokeDasharray="6 3"
        opacity={0.6}
      />
    );
  });
  return <g>{lines}</g>;
}
