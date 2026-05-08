import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { getPersonDisplayStrategyRegistration } from "../registry";
import {
  getDefaultVariantForStrategy,
  type PersonDisplayVariantId,
} from "../variants";

export interface ResolvePersonDisplayVariantParams {
  strategy: ChartViewStrategyName;
  requestedVariant?: PersonDisplayVariantId | null;
  isMobile: boolean;
}

export function resolvePersonDisplayVariant({
  strategy,
  requestedVariant,
  isMobile,
}: ResolvePersonDisplayVariantParams): PersonDisplayVariantId {
  const reg = getPersonDisplayStrategyRegistration(strategy);
  const allowed = isMobile ? reg.mobileVariants : reg.allowedVariants;

  if (requestedVariant && allowed.includes(requestedVariant)) {
    return requestedVariant;
  }
  const fallback = getDefaultVariantForStrategy(strategy);
  if (allowed.includes(fallback)) return fallback;
  return allowed[0];
}
