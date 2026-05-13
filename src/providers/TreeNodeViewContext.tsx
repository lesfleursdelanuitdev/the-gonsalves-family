"use client";

import { createContext, useContext, useMemo } from "react";
import { getTreeNodeViewSet } from "@/components/TreeViewer/TreeNodeViewFactory";
import type { TreeNodeViewStrategyKey } from "@/components/TreeViewer/v2/chartStrategy";

type TreeNodeViewSet = import("@/components/TreeViewer/TreeNodeViewFactory").TreeNodeViewSet;

const TreeNodeViewSetContext = createContext<TreeNodeViewSet | null>(null);

export interface TreeNodeViewProviderProps {
  strategyName: TreeNodeViewStrategyKey;
  children: React.ReactNode;
}

/**
 * Provides the current strategy's view set (ConnectorLines, SpouseJoinLines, PersonNodeView, UnionNodeView).
 * Option D (chart refactor): caller resolves chart strategy -> node-view strategy key
 * before entering this provider, so there is no implicit fallback policy here.
 */
export function TreeNodeViewProvider({ strategyName, children }: TreeNodeViewProviderProps) {
  const viewSet = useMemo(() => {
    return getTreeNodeViewSet(strategyName) ?? null;
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
