"use client";

import { useMemo } from "react";
import { collectAllPersonNodes } from "@/descendancy-chart";
import type { ChartNode } from "@/descendancy-chart";

export interface GoToPersonItem {
  id: string;
  firstName: string;
  lastName: string;
  x?: number;
  y?: number;
}

interface PersonContent {
  id: string;
  firstName: string;
  lastName: string;
}

export function useTreePeople(root: ChartNode): GoToPersonItem[] {
  return useMemo(() => {
    const nodes = collectAllPersonNodes(root);
    const withContent = nodes.filter((n) => n.content);
    const seen = new Set<string>();
    return withContent
      .map((n) => {
        const c = n.content as PersonContent;
        const x = "x" in n ? (n as { x: number }).x : undefined;
        const y = "y" in n ? (n as { y: number }).y : undefined;
        return {
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          x,
          y,
        };
      })
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
  }, [root]);
}
