"use client";

import { memo, useMemo } from "react";
import { PersonCard } from "@/components/DescendancyChart/FamilyTreeNodes/PersonNodeView";
import type { PersonCardProps } from "@/components/DescendancyChart/FamilyTreeNodes/PersonNodeView";
import { resolvePersonDisplayVariant, resolveRequestedVariantFromCardSettings } from "./factories";
import { variantToCardSettings } from "./renderers/tree/treePersonDisplayRenderer";

/**
 * Drop-in replacement for PersonCard via the personDisplay routing layer.
 * Resolves the active variant from current chart settings, then delegates
 * to PersonCard with variant-derived settings. Memoized so individual tree
 * nodes skip re-renders when their specific props are unchanged.
 */
export const PersonDisplayNodeView = memo(function PersonDisplayNodeView({
  settings,
  chartStrategy,
  isMobile,
  ...rest
}: PersonCardProps) {
  const strategy = chartStrategy ?? "descendancy";
  const isMob = isMobile ?? false;

  const resolvedSettings = useMemo(() => {
    const requestedVariant = resolveRequestedVariantFromCardSettings({
      strategy,
      personCardLayout: settings?.personCardLayout,
      personCardVariant: settings?.personCardVariant,
      compactCardSize: settings?.compactCardSize,
      isMobile: isMob,
    });
    const variant = resolvePersonDisplayVariant({ strategy, requestedVariant, isMobile: isMob });
    return variantToCardSettings(variant, settings);
  }, [strategy, isMob, settings]);

  return <PersonCard {...rest} settings={resolvedSettings} chartStrategy={chartStrategy} isMobile={isMobile} />;
});
