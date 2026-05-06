export const CARD_CORNER_RX = 14;

export const COLORS = {
  card: "#f8f2e6",
  cardStroke: "#ddd2bf",
  selectedStroke: "#9b2f2f",
  text: "#2f261d",
  muted: "#7d705f",
  date: "#9b2f2f",
  green: "#2f6f4e",
  iconBg: "#f1eadc",
  iconBgHover: "#e8ddca",
  iconStroke: "#6e6254",
  divider: "#ded3c0",
  pillBg: "#f1eadc",
  avatarRing: "#e9dfce",
  destructive: "#b42318",
} as const;

export type PersonCardLayout =
  | "avatarTopActionsBottom"
  | "avatarLeftActionsRight"
  | "avatarLeftActionsBottom"
  | "avatarTopActionsRight"
  | "avatarTopMobileMenu"
  | "avatarLeftMobileMenu";

export const DEFAULT_PERSON_CARD_LAYOUT: PersonCardLayout = "avatarTopActionsBottom";
export const MOBILE_PERSON_CARD_FALLBACK_LAYOUT: PersonCardLayout = "avatarLeftMobileMenu";

export interface PersonCardLayoutSettings {
  personCardLayout?: PersonCardLayout;
}

export const PERSON_CARD_LAYOUT_OPTIONS: Array<{
  value: PersonCardLayout;
  label: string;
}> = [
  { value: "avatarTopActionsBottom", label: "Avatar top · Actions bottom" },
  { value: "avatarLeftActionsRight", label: "Avatar left · Actions right" },
  { value: "avatarLeftActionsBottom", label: "Avatar left · Actions bottom" },
  { value: "avatarTopActionsRight", label: "Avatar top · Actions right" },
  { value: "avatarTopMobileMenu", label: "Avatar top · Menu" },
  { value: "avatarLeftMobileMenu", label: "Avatar left · Menu" },
];

export function resolvePersonCardLayout(
  layout: PersonCardLayout,
  isMobile: boolean
): PersonCardLayout {
  if (!isMobile) return layout;
  if (layout === "avatarTopMobileMenu" || layout === "avatarLeftMobileMenu") {
    return layout;
  }
  return MOBILE_PERSON_CARD_FALLBACK_LAYOUT;
}

export const PERSON_CARD_HEIGHT_BY_LAYOUT: Record<PersonCardLayout, number> = {
  avatarTopActionsBottom: 185,
  avatarLeftActionsRight: 155,
  avatarLeftActionsBottom: 165,
  avatarTopActionsRight: 190,
  avatarTopMobileMenu: 250,
  avatarLeftMobileMenu: 155,
};
