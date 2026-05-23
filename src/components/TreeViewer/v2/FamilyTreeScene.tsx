"use client";

import { FamilyTreeHeader, type FamilyTreeHeaderProps } from "./FamilyTreeHeader";
import { FamilyTreeEmbedToolbar } from "./FamilyTreeEmbedToolbar";
import { FamilyTreeShell } from "./FamilyTreeShell";
import { FamilyTreeCanvas, type FamilyTreeCanvasProps } from "./FamilyTreeCanvas";
import { FamilyTreeOverlays, type FamilyTreeOverlaysProps } from "./FamilyTreeOverlays";
import { FamilyTreeModals, type FamilyTreeModalsProps } from "./FamilyTreeModals";
import type { TreeNodeViewStrategyKey } from "./chartStrategy";

export interface FamilyTreeSceneProps {
  treeNodeViewStrategyKey: TreeNodeViewStrategyKey;
  familyTreeHeaderProps: FamilyTreeHeaderProps;
  familyTreeCanvasProps: FamilyTreeCanvasProps;
  familyTreeOverlaysProps: FamilyTreeOverlaysProps;
  familyTreeModalsProps: FamilyTreeModalsProps;
  embedMode?: boolean;
}

export function FamilyTreeScene({
  treeNodeViewStrategyKey,
  familyTreeHeaderProps,
  familyTreeCanvasProps,
  familyTreeOverlaysProps,
  familyTreeModalsProps,
  embedMode = false,
}: FamilyTreeSceneProps) {
  return (
    <FamilyTreeShell treeNodeViewStrategyKey={treeNodeViewStrategyKey} embedMode={embedMode}>
      {embedMode ? (
        <FamilyTreeEmbedToolbar {...familyTreeHeaderProps} />
      ) : (
        <FamilyTreeHeader {...familyTreeHeaderProps} />
      )}
      <FamilyTreeCanvas {...familyTreeCanvasProps} />
      <FamilyTreeOverlays {...familyTreeOverlaysProps} />
      <FamilyTreeModals {...familyTreeModalsProps} />
    </FamilyTreeShell>
  );
}
