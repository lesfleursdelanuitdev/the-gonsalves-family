import type { ReactNode } from "react";
import type { PersonDisplayRenderContext } from "../../types";
import type { PersonDisplayVariantId } from "../../variants";
import type { PersonCardProps, PersonCardSettings } from "@/components/DescendancyChart/FamilyTreeNodes/PersonNodeView";
import { PersonCard } from "@/components/DescendancyChart/FamilyTreeNodes/PersonNodeView";
import type { PersonCardLayout, PersonCardVariant, PersonCompactCardSize } from "@/lib/person-card-layout";

export type RenderTreePersonDisplayParams = PersonCardProps & {
  ctx: PersonDisplayRenderContext;
  variant: PersonDisplayVariantId;
};

export function variantToCardSettings(
  variant: PersonDisplayVariantId,
  base: PersonCardSettings | undefined,
): PersonCardSettings {
  const s: PersonCardSettings = { ...base };
  if (variant.startsWith("tree.full.")) {
    s.personCardLayout = variant.slice("tree.full.".length) as PersonCardLayout;
    s.personCardVariant = "full" as PersonCardVariant;
  } else if (variant.startsWith("tree.compact.name.")) {
    s.personCardVariant = "compact-name" as PersonCardVariant;
    s.compactCardSize = variant.slice("tree.compact.name.".length) as PersonCompactCardSize;
  } else if (variant.startsWith("tree.compact.avatar.")) {
    s.personCardVariant = "compact-avatar" as PersonCardVariant;
    s.compactCardSize = variant.slice("tree.compact.avatar.".length) as PersonCompactCardSize;
  }
  return s;
}

export function renderTreePersonDisplay({
  ctx,
  variant,
  settings,
  isMobile: _isMobile,
  ...personCardProps
}: RenderTreePersonDisplayParams): ReactNode {
  const resolvedSettings = variantToCardSettings(variant, settings);
  return <PersonCard {...personCardProps} settings={resolvedSettings} isMobile={ctx.isMobile} />;
}
