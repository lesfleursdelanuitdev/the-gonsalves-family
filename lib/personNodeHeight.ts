/**
 * Effective person node height from display settings and card layout (desktop variant / mobile).
 * Used so PersonNodeView and layout stay aligned when photos, dates, or actions are hidden.
 */

import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { PERSON_HEIGHT } from "@/genealogy-visualization-engine";
import {
  COMPACT_CARD_HEIGHT_BY_SIZE,
  DEFAULT_COMPACT_CARD_SIZE,
  DEFAULT_PERSON_CARD_LAYOUT,
  DEFAULT_PERSON_CARD_VARIANT,
  PERSON_CARD_HEIGHT_BY_LAYOUT,
  resolvePersonCardLayout,
  type PersonCardLayoutSettings,
} from "./person-card-layout";

/** Legacy baseline when no layout context is passed (tests / callers without strategy). */
export const FULL_PERSON_HEIGHT = PERSON_HEIGHT;

export interface PersonHeightSettings extends PersonCardLayoutSettings {
  showPhotos?: boolean;
  showDates?: boolean;
  showCardActionIcons?: boolean;
}

export interface PersonHeightLayoutContext {
  chartStrategy?: ChartViewStrategyName;
  isMobile?: boolean;
}

function photoDeduction(
  layout: ReturnType<typeof resolvePersonCardLayout>,
  showPhotos: boolean
): number {
  if (showPhotos) return 0;
  switch (layout) {
    case "avatarTopActionsBottom":
    case "avatarTopActionsRight":
    case "avatarTopMobileMenu":
      return 52;
    case "avatarLeftActionsBottom":
    case "avatarLeftActionsRight":
    case "avatarLeftMobileMenu":
      return 54;
    default:
      return 52;
  }
}

function datesDeduction(showDates: boolean): number {
  if (showDates) return 0;
  return 20;
}

function actionsDeduction(
  layout: ReturnType<typeof resolvePersonCardLayout>,
  showCardActionIcons: boolean,
  showDates: boolean
): number {
  if (showCardActionIcons) return 0;
  if (layout === "avatarTopMobileMenu" || layout === "avatarLeftMobileMenu") {
    void showDates;
    return 0;
  }
  switch (layout) {
    case "avatarTopActionsBottom":
      return showDates ? 34 : 40;
    case "avatarTopActionsRight":
      return showDates ? 36 : 44;
    case "avatarLeftActionsBottom":
      return showDates ? 28 : 36;
    case "avatarLeftActionsRight":
      return showDates ? 26 : 34;
    default:
      return showDates ? 34 : 40;
  }
}

/**
 * Returns the effective height of a person node given display settings and optional layout context.
 * When context is omitted, uses desktop descendancy layout (v3) for deductions so height stays stable for legacy callers.
 */
export function getEffectivePersonHeight(
  settings: PersonHeightSettings = {},
  context?: PersonHeightLayoutContext
): number {
  const variant = settings.personCardVariant ?? DEFAULT_PERSON_CARD_VARIANT;
  if (variant === "compact-name" || variant === "compact-avatar") {
    const sz = settings.compactCardSize ?? DEFAULT_COMPACT_CARD_SIZE;
    return Math.max(28, COMPACT_CARD_HEIGHT_BY_SIZE[sz]);
  }
  const showPhotos = settings.showPhotos !== false;
  const showDates = settings.showDates !== false;
  void context?.chartStrategy;
  const isMobile = context?.isMobile ?? false;
  const requestedLayout = settings.personCardLayout ?? DEFAULT_PERSON_CARD_LAYOUT;
  const layout = resolvePersonCardLayout(requestedLayout, isMobile);
  const showCardActionIcons =
    layout === "avatarTopMobileMenu" || layout === "avatarLeftMobileMenu"
      ? false
      : settings.showCardActionIcons !== false;
  let height = PERSON_CARD_HEIGHT_BY_LAYOUT[layout];
  height -= photoDeduction(layout, showPhotos);
  height -= datesDeduction(showDates);
  height -= actionsDeduction(layout, showCardActionIcons, showDates);
  if (
    (layout === "avatarTopMobileMenu" || layout === "avatarLeftMobileMenu") &&
    showPhotos &&
    showDates
  ) {
    // Keep mobile cards at their base geometry so avatar circles are not vertically distorted.
    height = PERSON_CARD_HEIGHT_BY_LAYOUT[layout];
  }
  return Math.max(96, Math.round(height));
}
