import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { CHART_STRATEGY_META } from "../../chartStrategy";
import type { PersonDisplayFamily as ChartPersonDisplayFamily } from "../../chartStrategy";
import type { PersonDisplayVariantId } from "../variants";
import { FAN_VARIANTS, TREE_VARIANTS } from "../variants";

export type PersonDisplayFamily = ChartPersonDisplayFamily;

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
    family: CHART_STRATEGY_META.descendancy.personDisplayFamily,
    allowedVariants: TREE_VARIANTS,
    mobileVariants: TREE_MOBILE_VARIANTS,
  },
  pedigree: {
    strategy: "pedigree",
    family: CHART_STRATEGY_META.pedigree.personDisplayFamily,
    allowedVariants: TREE_VARIANTS,
    mobileVariants: TREE_MOBILE_VARIANTS,
  },
  vertical_pedigree: {
    strategy: "vertical_pedigree",
    family: CHART_STRATEGY_META.vertical_pedigree.personDisplayFamily,
    allowedVariants: TREE_VARIANTS,
    mobileVariants: TREE_MOBILE_VARIANTS,
  },
  fan_chart: {
    strategy: "fan_chart",
    family: CHART_STRATEGY_META.fan_chart.personDisplayFamily,
    allowedVariants: FAN_VARIANTS,
    mobileVariants: FAN_VARIANTS,
  },
};

export function getPersonDisplayStrategyRegistration(
  strategy: ChartViewStrategyName
): PersonDisplayStrategyRegistration {
  return PERSON_DISPLAY_STRATEGY_REGISTRY[strategy];
}
