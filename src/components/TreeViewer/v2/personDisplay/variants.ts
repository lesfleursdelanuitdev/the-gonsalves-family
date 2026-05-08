import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";

export type PersonDisplayVariantId =
  | "tree.full.avatarTopActionsBottom"
  | "tree.full.avatarTopActionsRight"
  | "tree.full.avatarLeftActionsBottom"
  | "tree.full.avatarLeftActionsRight"
  | "tree.full.avatarTopMobileMenu"
  | "tree.full.avatarLeftMobileMenu"
  | "tree.compact.name.large"
  | "tree.compact.name.medium"
  | "tree.compact.name.small"
  | "tree.compact.name.extraSmall"
  | "tree.compact.avatar.large"
  | "tree.compact.avatar.medium"
  | "tree.compact.avatar.small"
  | "tree.compact.avatar.extraSmall"
  | "fan.cell.default";

export const TREE_VARIANTS: readonly PersonDisplayVariantId[] = [
  "tree.full.avatarTopActionsBottom",
  "tree.full.avatarTopActionsRight",
  "tree.full.avatarLeftActionsBottom",
  "tree.full.avatarLeftActionsRight",
  "tree.full.avatarTopMobileMenu",
  "tree.full.avatarLeftMobileMenu",
  "tree.compact.name.large",
  "tree.compact.name.medium",
  "tree.compact.name.small",
  "tree.compact.name.extraSmall",
  "tree.compact.avatar.large",
  "tree.compact.avatar.medium",
  "tree.compact.avatar.small",
  "tree.compact.avatar.extraSmall",
] as const;

export const FAN_VARIANTS: readonly PersonDisplayVariantId[] = ["fan.cell.default"] as const;

export function getDefaultVariantForStrategy(
  strategy: ChartViewStrategyName
): PersonDisplayVariantId {
  return strategy === "fan_chart"
    ? "fan.cell.default"
    : "tree.full.avatarTopActionsBottom";
}
