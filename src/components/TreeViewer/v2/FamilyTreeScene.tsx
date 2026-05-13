"use client";

import { FamilyTreeHeader, type FamilyTreeHeaderProps } from "./FamilyTreeHeader";
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
}

export function FamilyTreeScene({
  treeNodeViewStrategyKey,
  familyTreeHeaderProps,
  familyTreeCanvasProps,
  familyTreeOverlaysProps,
  familyTreeModalsProps,
}: FamilyTreeSceneProps) {
  return (
    <FamilyTreeShell treeNodeViewStrategyKey={treeNodeViewStrategyKey}>
      <FamilyTreeHeader {...familyTreeHeaderProps} />
      <FamilyTreeCanvas {...familyTreeCanvasProps} />
      <FamilyTreeOverlays {...familyTreeOverlaysProps} />
      <FamilyTreeModals {...familyTreeModalsProps} />
    </FamilyTreeShell>
  );
}
