import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import type { PersonDisplayVariantId } from "../variants";
import { FAN_VARIANTS, TREE_VARIANTS } from "../variants";

export type PersonDisplayFamily = "tree" | "fan";

export interface PersonDisplayStrategyRegistration {
  strategy: ChartViewStrategyName;
  family: PersonDisplayFamily;
  allowedVariants: readonly PersonDisplayVariantId[];
  mobileVariants: readonly PersonDisplayVariantId[];
}

const TREE_MOBILE_VARIANTS: readonly PersonDisplayVariantId[] = [
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

export const PERSON_DISPLAY_STRATEGY_REGISTRY: Record<
  ChartViewStrategyName,
  PersonDisplayStrategyRegistration
> = {
  descendancy: {
    strategy: "descendancy",
    family: "tree",
    allowedVariants: TREE_VARIANTS,
    mobileVariants: TREE_MOBILE_VARIANTS,
  },
  pedigree: {
    strategy: "pedigree",
    family: "tree",
    allowedVariants: TREE_VARIANTS,
    mobileVariants: TREE_MOBILE_VARIANTS,
  },
  vertical_pedigree: {
    strategy: "vertical_pedigree",
    family: "tree",
    allowedVariants: TREE_VARIANTS,
    mobileVariants: TREE_MOBILE_VARIANTS,
  },
  fan_chart: {
    strategy: "fan_chart",
    family: "fan",
    allowedVariants: FAN_VARIANTS,
    mobileVariants: FAN_VARIANTS,
  },
};

export function getPersonDisplayStrategyRegistration(
  strategy: ChartViewStrategyName
): PersonDisplayStrategyRegistration {
  return PERSON_DISPLAY_STRATEGY_REGISTRY[strategy];
}
