"use client";

import { createContext, useContext, useMemo } from "react";
import { getTreeNodeViewSet } from "@/components/TreeViewer/TreeNodeViewFactory";

type TreeNodeViewSet = import("@/components/TreeViewer/TreeNodeViewFactory").TreeNodeViewSet;

const TreeNodeViewSetContext = createContext<TreeNodeViewSet | null>(null);

export interface TreeNodeViewProviderProps {
  strategyName: string;
  children: React.ReactNode;
}

/**
 * Provides the current strategy's view set (ConnectorLines, SpouseJoinLines, PersonNodeView, UnionNodeView).
 * When strategyName is not registered, falls back to "descendancy".
 */
export function TreeNodeViewProvider({ strategyName, children }: TreeNodeViewProviderProps) {
  const viewSet = useMemo(() => {
    const set = getTreeNodeViewSet(strategyName) ?? getTreeNodeViewSet("descendancy");
    return set ?? null;
  }, [strategyName]);

  return (
    <TreeNodeViewSetContext.Provider value={viewSet}>
      {children}
    </TreeNodeViewSetContext.Provider>
  );
}

export function useTreeNodeViewSet(): TreeNodeViewSet | null {
  return useContext(TreeNodeViewSetContext);
}
