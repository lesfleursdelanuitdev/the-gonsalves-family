"use client";

import { TreeNodeViewProvider } from "@/providers/TreeNodeViewContext";
import type { TreeNodeViewStrategyKey } from "./chartStrategy";

export interface FamilyTreeShellProps {
  treeNodeViewStrategyKey: TreeNodeViewStrategyKey;
  children: React.ReactNode;
}

export function FamilyTreeShell({
  treeNodeViewStrategyKey,
  children,
}: FamilyTreeShellProps) {
  return (
    <TreeNodeViewProvider strategyName={treeNodeViewStrategyKey}>
      <style>{`
        .tree-viewer-root {
          min-height: var(--app-height, 100svh);
        }
        @media (max-width: 640px) {
          .tree-viewer-root {
            height: var(--app-height, var(--mobile-viewport-height, 100dvh));
            max-height: var(--app-height, var(--mobile-viewport-height, 100dvh));
            min-height: var(--app-height, var(--mobile-viewport-height, 100dvh));
            width: 100%;
            max-width: var(--mobile-viewport-width, 100dvw);
            overflow: hidden;
            overflow-x: hidden;
          }
        }
      `}</style>
      <div
        className="tree-viewer-root font-body"
        style={{
          background: "var(--tree-bg)",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </TreeNodeViewProvider>
  );
}
