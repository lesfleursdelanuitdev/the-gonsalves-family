import type { TreePersonDisplayLayout } from "../../types";

export interface BuildTreePersonLayoutParams {
  cx: number;
  top: number;
}

export function buildTreePersonLayout({
  cx,
  top,
}: BuildTreePersonLayoutParams): TreePersonDisplayLayout {
  return {
    kind: "tree",
    cx,
    top,
  };
}
