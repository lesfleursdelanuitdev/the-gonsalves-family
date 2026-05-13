"use client";

import type { ChartNode, TreeAction } from "@/genealogy-visualization-engine";
import { useHistoryHandlers } from "./useHistoryHandlers";
import { useTreePeople } from "./useTreePeople";
import { useRootDisplayName } from "./useRootDisplayName";

export interface UseFamilyTreeDerivedDataParams {
  dispatch: (action: TreeAction) => void;
  closeSpouseDrawer: () => void;
  setPan: (pan: { x: number; y: number }) => void;
  root: ChartNode;
  rootId: string;
  effectiveRootId: string;
  rootDisplayNames: Record<string, string>;
  setRootDisplayNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  chartDataKey: number;
}

export function useFamilyTreeDerivedData({
  dispatch,
  closeSpouseDrawer,
  setPan,
  root,
  rootId,
  effectiveRootId,
  rootDisplayNames,
  setRootDisplayNames,
  chartDataKey,
}: UseFamilyTreeDerivedDataParams) {
  const treePeople = useTreePeople(root);

  const rootDisplayName = useRootDisplayName(
    rootId,
    effectiveRootId,
    rootDisplayNames,
    setRootDisplayNames,
    chartDataKey
  );

  const historyHandlers = useHistoryHandlers({
    dispatch,
    closeDrawer: closeSpouseDrawer,
    setPan,
  });

  return { treePeople, rootDisplayName, historyHandlers };
}
