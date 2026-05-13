import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import type {
  PersonCardLayout,
  PersonCardVariant,
  PersonCompactCardSize,
} from "@/lib/person-card-layout";
import { resolvePersonCardLayout } from "@/lib/person-card-layout";
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

export interface ResolveRequestedVariantFromCardSettingsParams {
  strategy: ChartViewStrategyName;
  personCardLayout?: PersonCardLayout;
  personCardVariant?: PersonCardVariant;
  compactCardSize?: PersonCompactCardSize;
  isMobile: boolean;
}

function toVariantCompactSize(size: PersonCompactCardSize): "large" | "medium" | "small" | "extraSmall" {
  return size === "extra-small" ? "extraSmall" : size;
}

/**
 * Maps current card settings to a strategy-scoped PersonDisplay variant id.
 * Returns null for fan (fan variant is fixed by strategy policy).
 */
export function resolveRequestedVariantFromCardSettings({
  strategy,
  personCardLayout,
  personCardVariant,
  compactCardSize,
  isMobile,
}: ResolveRequestedVariantFromCardSettingsParams): PersonDisplayVariantId | null {
  if (strategy === "fan_chart") {
    return null;
  }
  const compactSize = toVariantCompactSize(compactCardSize ?? "medium");
  if (personCardVariant === "compact-name") {
    return `tree.compact.name.${compactSize}`;
  }
  if (personCardVariant === "compact-avatar") {
    return `tree.compact.avatar.${compactSize}`;
  }
  const fullLayout = resolvePersonCardLayout(personCardLayout ?? "avatarTopActionsBottom", isMobile);
  return `tree.full.${fullLayout}`;
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
