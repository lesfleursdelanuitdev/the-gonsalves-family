"use client";

import { TreeNodeViewProvider } from "@/providers/TreeNodeViewContext";
import type { TreeNodeViewStrategyKey } from "./chartStrategy";

export interface FamilyTreeShellProps {
  treeNodeViewStrategyKey: TreeNodeViewStrategyKey;
  children: React.ReactNode;
  embedMode?: boolean;
}

export function FamilyTreeShell({
  treeNodeViewStrategyKey,
  children,
  embedMode = false,
}: FamilyTreeShellProps) {
  return (
    <TreeNodeViewProvider strategyName={treeNodeViewStrategyKey}>
      {!embedMode && (
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
      )}
      <div
        className={embedMode ? "font-body" : "tree-viewer-root font-body"}
        style={{
          background: "var(--tree-bg)",
          display: "flex",
          flexDirection: "column",
          ...(embedMode ? { height: "100%", minHeight: 0 } : { flex: 1, minHeight: 0 }),
        }}
      >
        {children}
      </div>
    </TreeNodeViewProvider>
  );
}
