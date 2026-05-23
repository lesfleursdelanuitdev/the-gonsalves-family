"use client";

import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { getPeople, getBirthUnionByChild, PERSON_WIDTH } from "@/genealogy-visualization-engine";
import type { ChartViewStrategyName, DescendancyPerson, PersonCardAction } from "@/genealogy-visualization-engine";
import { getEffectivePersonHeight } from "@/lib/personNodeHeight";
import { getNameBackgroundColor, NAME_UNDERLINE_PX } from "@/lib/person-name-accent";
import { getPedigreeCardActions } from "@/lib/pedigreeCardActions";
import {
  CARD_CORNER_RX,
  COLORS,
  DEFAULT_PERSON_CARD_LAYOUT,
  DEFAULT_PERSON_CARD_VARIANT,
  PERSON_CARD_HEIGHT_BY_LAYOUT,
  resolvePersonCardLayout,
  type PersonCardLayout,
  type PersonCardVariant,
  type PersonCompactCardSize,
} from "@/lib/person-card-layout";
import { CompactPersonCard } from "./CompactPersonCard";
import {
  IconArrowDown,
  IconChevronDown,
  IconChevronUp,
  IconCrown,
  IconHeart,
  IconHome,
  IconMoreHorizontal,
  IconPerson,
  IconPersonFemale,
  IconPersonMale,
  IconUsers,
  IconX,
} from "../../TreeViewer/Misc/SvgIcons";
import {
  CHART_PERSON_OVERFLOW_MENU_Z_INDEX,
  useChartViewportOverlay,
} from "../../TreeViewer/v2/ChartViewport/ChartViewportOverlayContext";

const CARD_W = PERSON_WIDTH;

/** Extra vertical space for name area (top + bottom padding). */
const NAME_ROW_EXTRA_HEIGHT = 12;

export type ActionBtn = {
  Icon: typeof IconUsers;
  title: string;
  action: PersonCardAction;
};

/** Shared styling for HTML overflow menus embedded via foreignObject */
function overflowMenuChromeStyles(): {
  panel: CSSProperties;
  row: CSSProperties;
  icon: CSSProperties;
} {
  return {
    panel: {
      background: COLORS.card,
      borderRadius: 12,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      border: `1px solid ${COLORS.cardStroke}`,
      padding: 6,
      fontFamily: "system-ui, sans-serif",
      touchAction: "manipulation" as const,
    },
    row: {
      display: "flex",
      width: "100%",
      alignItems: "center",
      gap: 8,
      textAlign: "left" as const,
      padding: "10px 10px",
      border: "none",
      background: "transparent",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 14,
      color: COLORS.text,
    },
    icon: {
      width: 24,
      height: 24,
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };
}

/** Same stroke icons as {@link ActionIconRow} / rail, for HTML overflow menus (foreignObject / portal). */
function SvgActionIcon({ Icon, stroke = COLORS.iconStroke }: { Icon: ActionBtn["Icon"]; stroke?: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden style={{ display: "block" }}>
      <Icon x={12} y={12} size={18} stroke={stroke} fill="none" />
    </svg>
  );
}

function buildActionButtons(
  person: DescendancyPerson,
  opts: {
    isRoot: boolean;
    hasParents: boolean;
    hasSpouses: boolean;
    onlyRoot: boolean;
    isSpouse: boolean;
    isLinkedSpouse: boolean;
    isLeaf: boolean;
    hasDescendantsInData: boolean;
    isSubtreeCollapsed: boolean;
  }
): ActionBtn[] {
  const {
    isRoot,
    hasParents,
    hasSpouses,
    onlyRoot,
    isSpouse,
    isLinkedSpouse,
    isLeaf,
    hasDescendantsInData,
    isSubtreeCollapsed,
  } = opts;
  const buttons: ActionBtn[] = [];
  if (!isSpouse && !isLinkedSpouse && isRoot && hasParents) {
    buttons.push({ Icon: IconUsers, title: "Show parents & siblings", action: "showSiblings" });
  }
  if (!onlyRoot && !isSpouse && !isLinkedSpouse && hasSpouses) {
    buttons.push({ Icon: IconHeart, title: "Show spouses", action: "showSpouses" });
  }
  if (!isRoot) {
    buttons.push({ Icon: IconHome, title: "Set as root", action: "root" });
  }
  if (hasDescendantsInData && !isSpouse && !isLinkedSpouse) {
    if (isSubtreeCollapsed) {
      buttons.push({ Icon: IconChevronDown, title: "Expand subtree", action: "expandSubtree" });
    } else {
      buttons.push({ Icon: IconChevronUp, title: "Collapse subtree", action: "collapseSubtree" });
    }
  }
  if (isLeaf && hasDescendantsInData) {
    buttons.push({ Icon: IconArrowDown, title: "More", action: "expandDown" });
  }
  return buttons;
}

function ActionIconRow({
  buttons,
  cy,
  cardW,
  compact,
  onAction,
  personId,
}: {
  buttons: ActionBtn[];
  cy: number;
  cardW: number;
  compact?: boolean;
  onAction: (action: PersonCardAction, personId: string) => void;
  personId: string;
}) {
  const r = compact ? 15 : 18;
  const iconSize = compact ? 15 : 16;
  const gap = compact ? 8 : 10;
  const count = buttons.length;
  if (count === 0) return null;
  const rowW = count * 2 * r + (count - 1) * gap;
  let cx0 = (cardW - rowW) / 2 + r;
  cx0 = Math.max(r + 4, Math.min(cx0, cardW - r - 4 - (count - 1) * (2 * r + gap)));
  return (
    <g>
      {buttons.map((btn, i) => {
        const cx = cx0 + i * (2 * r + gap);
        return (
          <g
            key={btn.title}
            style={{ cursor: "pointer" }}
            className="person-card-action"
            onClick={(e) => {
              e.stopPropagation();
              onAction(btn.action, personId);
            }}
            onMouseEnter={(e) => {
              const g = e.currentTarget as SVGGElement;
              const c = g.querySelector("circle");
              if (c) {
                c.setAttribute("fill", COLORS.iconBgHover);
                c.setAttribute("stroke", COLORS.cardStroke);
              }
              g.querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.text));
            }}
            onMouseLeave={(e) => {
              const g = e.currentTarget as SVGGElement;
              const c = g.querySelector("circle");
              if (c) {
                c.setAttribute("fill", COLORS.iconBg);
                c.setAttribute("stroke", COLORS.cardStroke);
              }
              g.querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.iconStroke));
            }}
          >
            <title>{btn.title}</title>
            <circle cx={cx} cy={cy} r={r} fill={COLORS.iconBg} stroke={COLORS.cardStroke} strokeWidth={1} />
            <btn.Icon x={cx} y={cy} size={iconSize} stroke={COLORS.iconStroke} fill="none" />
          </g>
        );
      })}
    </g>
  );
}

/** Vertically distribute rail icon centers from upper to lower inset (even gaps between neighbors). */
function verticalRailIconCentersY(cardH: number, slotCount: number, circleR: number): number[] {
  const edgeMargin = 16;
  const yMin = edgeMargin + circleR;
  const yMax = cardH - edgeMargin - circleR;
  const span = Math.max(yMax - yMin, 0);
  if (slotCount <= 0) return [];
  if (slotCount === 1) return [yMin + span / 2];
  return Array.from({ length: slotCount }, (_, i) => yMin + (i / (slotCount - 1)) * span);
}

function ActionIconRail({
  buttons,
  cardH,
  cx,
  compact,
  onAction,
  personId,
}: {
  buttons: ActionBtn[];
  cardH: number;
  cx: number;
  compact?: boolean;
  onAction: (action: PersonCardAction, personId: string) => void;
  personId: string;
}) {
  const r = compact ? 15 : 18;
  const iconSize = compact ? 15 : 16;
  const centersY = verticalRailIconCentersY(cardH, buttons.length, r);
  return (
    <g>
      {buttons.map((btn, i) => {
        const cy = centersY[i] ?? cardH / 2;
        return (
          <g
            key={btn.title}
            style={{ cursor: "pointer" }}
            className="person-card-action"
            onClick={(e) => {
              e.stopPropagation();
              onAction(btn.action, personId);
            }}
            onMouseEnter={(e) => {
              const g = e.currentTarget as SVGGElement;
              const c = g.querySelector("circle");
              if (c) {
                c.setAttribute("fill", COLORS.iconBgHover);
                c.setAttribute("stroke", COLORS.cardStroke);
              }
              g.querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.text));
            }}
            onMouseLeave={(e) => {
              const g = e.currentTarget as SVGGElement;
              const c = g.querySelector("circle");
              if (c) {
                c.setAttribute("fill", COLORS.iconBg);
                c.setAttribute("stroke", COLORS.cardStroke);
              }
              g.querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.iconStroke));
            }}
          >
            <title>{btn.title}</title>
            <circle cx={cx} cy={cy} r={r} fill={COLORS.iconBg} stroke={COLORS.cardStroke} strokeWidth={1} />
            <btn.Icon x={cx} y={cy} size={iconSize} stroke={COLORS.iconStroke} fill="none" />
          </g>
        );
      })}
    </g>
  );
}

function railSlotCys(cardH: number, slotCount: number, circleR: number): number[] {
  return verticalRailIconCentersY(cardH, slotCount, circleR);
}

/** Avatar-left / actions-right: when there are many actions, show 2 on the rail + a "more" opener. */
function ActionIconRailAvatarLeftWithOverflow({
  buttons,
  cardH,
  cx,
  compact,
  onAction,
  personId,
  onMoreToggle,
}: {
  buttons: [ActionBtn, ActionBtn];
  cardH: number;
  cx: number;
  compact?: boolean;
  onAction: (action: PersonCardAction, personId: string) => void;
  personId: string;
  onMoreToggle: (e: React.MouseEvent) => void;
}) {
  const r = compact ? 15 : 18;
  const iconSize = compact ? 15 : 16;
  const [cy0, cy1, cyMore] = railSlotCys(cardH, 3, r);
  function renderActionSlot(btn: ActionBtn, cy: number, key: string) {
    return (
      <g
        key={key}
        style={{ cursor: "pointer" }}
        className="person-card-action"
        onClick={(e) => {
          e.stopPropagation();
          onAction(btn.action, personId);
        }}
        onMouseEnter={(e) => {
          const g = e.currentTarget as SVGGElement;
          const c = g.querySelector("circle");
          if (c) {
            c.setAttribute("fill", COLORS.iconBgHover);
            c.setAttribute("stroke", COLORS.cardStroke);
          }
          g.querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.text));
        }}
        onMouseLeave={(e) => {
          const g = e.currentTarget as SVGGElement;
          const c = g.querySelector("circle");
          if (c) {
            c.setAttribute("fill", COLORS.iconBg);
            c.setAttribute("stroke", COLORS.cardStroke);
          }
          g.querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.iconStroke));
        }}
      >
        <title>{btn.title}</title>
        <circle cx={cx} cy={cy} r={r} fill={COLORS.iconBg} stroke={COLORS.cardStroke} strokeWidth={1} />
        <btn.Icon x={cx} y={cy} size={iconSize} stroke={COLORS.iconStroke} fill="none" />
      </g>
    );
  }
  return (
    <g>
      {renderActionSlot(buttons[0], cy0, buttons[0].title)}
      {renderActionSlot(buttons[1], cy1, buttons[1].title)}
      <g
        style={{ cursor: "pointer" }}
        className="person-card-action person-card-action-more"
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onMoreToggle(e as unknown as React.MouseEvent);
        }}
        onMouseEnter={(e) => {
          const gEl = e.currentTarget as SVGGElement;
          const c = gEl.querySelector(".rail-more-circle");
          if (c) {
            c.setAttribute("fill", COLORS.iconBgHover);
            c.setAttribute("stroke", COLORS.cardStroke);
          }
          gEl.querySelectorAll("[data-more-dot]").forEach((dot) => {
            (dot as SVGCircleElement).setAttribute("fill", COLORS.text);
          });
        }}
        onMouseLeave={(e) => {
          const gEl = e.currentTarget as SVGGElement;
          const c = gEl.querySelector(".rail-more-circle");
          if (c) {
            c.setAttribute("fill", COLORS.iconBg);
            c.setAttribute("stroke", COLORS.cardStroke);
          }
          gEl.querySelectorAll("[data-more-dot]").forEach((dot) => {
            (dot as SVGCircleElement).setAttribute("fill", COLORS.iconStroke);
          });
        }}
      >
        <title>More actions</title>
        <circle className="rail-more-circle" cx={cx} cy={cyMore} r={r} fill={COLORS.iconBg} stroke={COLORS.cardStroke} strokeWidth={1} />
        {(() => {
          const s = iconSize / 24;
          return (
            <g transform={`translate(${cx}, ${cyMore}) scale(${s}) translate(-12, -12)`}>
              <circle data-more-dot cx={5} cy={12} r={1.6} fill={COLORS.iconStroke} />
              <circle data-more-dot cx={12} cy={12} r={1.6} fill={COLORS.iconStroke} />
              <circle data-more-dot cx={19} cy={12} r={1.6} fill={COLORS.iconStroke} />
            </g>
          );
        })()}
      </g>
    </g>
  );
}

export interface PersonCardSettings {
  showDates?: boolean;
  showPhotos?: boolean;
  showUnknown?: boolean;
  showCardActionIcons?: boolean;
  personCardLayout?: PersonCardLayout;
  personCardVariant?: PersonCardVariant;
  compactCardSize?: PersonCompactCardSize;
}

type LegacyDesktopVariant = "v1" | "v2" | "v3" | "v4";

function toLegacyRenderVariant(layout: PersonCardLayout): {
  mode: "mobile" | "desktop";
  mobileVariant?: "portrait" | "avatarLeft";
  desktopVariant?: LegacyDesktopVariant;
} {
  switch (layout) {
    case "avatarTopActionsBottom":
      return { mode: "desktop", desktopVariant: "v1" };
    case "avatarTopActionsRight":
      return { mode: "desktop", desktopVariant: "v2" };
    case "avatarLeftActionsBottom":
      return { mode: "desktop", desktopVariant: "v3" };
    case "avatarLeftActionsRight":
      return { mode: "desktop", desktopVariant: "v4" };
    case "avatarTopMobileMenu":
      return { mode: "mobile", mobileVariant: "portrait" };
    case "avatarLeftMobileMenu":
    default:
      return { mode: "mobile", mobileVariant: "avatarLeft" };
  }
}

export interface PersonCardProps {
  cx: number;
  y: number;
  person: DescendancyPerson;
  isRoot?: boolean;
  isSpouse?: boolean;
  isLinkedSpouse?: boolean;
  hasSpouses?: boolean;
  hasParents?: boolean;
  onlyRoot?: boolean;
  isLeaf?: boolean;
  hasDescendantsInData?: boolean;
  isSubtreeCollapsed?: boolean;
  onAction?: (action: PersonCardAction, personId: string) => void;
  onNameClick?: (person: { name: string; xref: string; uuid: string | null }) => void;
  settings?: PersonCardSettings;
  chartStrategy?: ChartViewStrategyName;
  isMobile?: boolean;
  /** Pedigree / vertical pedigree: generation index (0 = root, −1 = parents, …). */
  pedigreeGeneration?: number;
  pedigreeGlobalMinGen?: number;
  hasMultipleFamiliesAsChild?: boolean;
  /** Pedigree: show "Expand ancestors" on this node (last column + depth cap). */
  pedigreeShowExpandAncestorsAction?: boolean;
  /** Pedigree: this node is where ancestor collapse is applied — offer “Show ancestors”. */
  pedigreeIsAncestorCollapseTarget?: boolean;
  /** Pedigree root-only: siblings expansion currently shown. */
  pedigreeRootSiblingsExpanded?: boolean;
  /** Pedigree root-only: children expansion currently shown. */
  pedigreeRootChildrenExpanded?: boolean;
}

export const PersonCard = memo(function PersonCard({
  cx,
  y,
  person,
  isRoot = false,
  isSpouse = false,
  isLinkedSpouse = false,
  hasSpouses = false,
  hasParents = false,
  onlyRoot = false,
  isLeaf = false,
  hasDescendantsInData = false,
  isSubtreeCollapsed = false,
  onAction,
  onNameClick,
  settings = {},
  chartStrategy = "descendancy",
  isMobile = false,
  pedigreeGeneration,
  pedigreeGlobalMinGen,
  hasMultipleFamiliesAsChild = false,
  pedigreeShowExpandAncestorsAction = false,
  pedigreeIsAncestorCollapseTarget = false,
  pedigreeRootSiblingsExpanded = false,
  pedigreeRootChildrenExpanded = false,
}: PersonCardProps) {
  const photoClipId = useId().replace(/:/g, "");
  const [menuOpen, setMenuOpen] = useState(false);
  /** Desktop avatar-top / actions-right overflow menu */
  const [railOverflowOpenTop, setRailOverflowOpenTop] = useState(false);
  /** Desktop avatar-left / actions-right: overflow actions behind "more" rail slot */
  const [railOverflowOpen, setRailOverflowOpen] = useState(false);
  const requestedLayout = settings.personCardLayout ?? DEFAULT_PERSON_CARD_LAYOUT;
  const resolvedLayout = resolvePersonCardLayout(requestedLayout, isMobile);
  const renderLayout = toLegacyRenderVariant(resolvedLayout);
  const baseH = PERSON_CARD_HEIGHT_BY_LAYOUT[resolvedLayout];
  const effectiveHeight = getEffectivePersonHeight(
    { ...settings, personCardLayout: requestedLayout },
    { isMobile }
  );
  const innerScaleY = baseH > 0 ? effectiveHeight / baseH : 1;
  const x = cx - CARD_W / 2;
  const top = y - effectiveHeight / 2;

  const { id, firstName, lastName, birthYear, deathYear, _hiddenCount, _isShadow, _unknownPlaceholder } = person;
  const overlayPerson = {
    name: `${firstName} ${lastName}`.trim() || "Unknown",
    xref: person.xref ?? id,
    uuid: person.uuid ?? null,
  };
  const handleNameClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onNameClick?.(overlayPerson);
    },
    [onNameClick, overlayPerson]
  );

  const accentNameSpanStyle = useCallback(
    (extra?: CSSProperties): CSSProperties => ({
      borderBottom: `${NAME_UNDERLINE_PX}px solid ${getNameBackgroundColor(person.gender)}`,
      display: "inline-block",
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      verticalAlign: "bottom",
      boxSizing: "border-box",
      ...(onNameClick ? { cursor: "pointer" } : {}),
      ...extra,
    }),
    [onNameClick, person.gender]
  );

  const showPhotos = settings.showPhotos !== false;
  const showDates = settings.showDates !== false;
  const showCardActionIcons = settings.showCardActionIcons !== false;

  const isPedigreeChart = chartStrategy === "pedigree" || chartStrategy === "vertical_pedigree";
  const actionButtons: ActionBtn[] =
    isPedigreeChart &&
    pedigreeGeneration != null &&
    pedigreeGlobalMinGen != null &&
    !isSpouse &&
    !isLinkedSpouse
      ? (getPedigreeCardActions(person, {
          isRoot,
          generationIndex: pedigreeGeneration,
          globalMinGeneration: pedigreeGlobalMinGen,
          hasMultipleFamiliesAsChild,
          showExpandAncestors: pedigreeShowExpandAncestorsAction,
          isAncestorCollapseTarget: pedigreeIsAncestorCollapseTarget,
          rootSiblingsExpanded: pedigreeRootSiblingsExpanded,
          rootChildrenExpanded: pedigreeRootChildrenExpanded,
        }) as ActionBtn[])
      : buildActionButtons(person, {
          isRoot,
          hasParents,
          hasSpouses,
          onlyRoot,
          isSpouse,
          isLinkedSpouse,
          isLeaf,
          hasDescendantsInData,
          isSubtreeCollapsed,
        });

  const initials =
    `${(firstName?.[0] ?? "").toUpperCase()}${(lastName?.[0] ?? "").toUpperCase()}`.trim() || "?";

  const crownX = 22;
  const crownY = 22;
  const menuCx = CARD_W - 28;
  const menuCy = 28;
  /** Close spouse / linked union: always upper-left (card-local coords before translate), regardless of rail or ⋯ placement. */
  const closeActionCx = 22;
  const closeActionCy = 22;
  const closeActionHitX = closeActionCx - 11;
  const closeActionHitY = closeActionCy - 11;

  const chartViewportOverlay = useChartViewportOverlay();
  const mobileOverflowBtnRef = useRef<SVGGElement | null>(null);
  const MOBILE_OVERFLOW_MENU_W = 186;
  const useMobileMenuPortal = chartViewportOverlay != null;

  const mobileMenuRowStyle: CSSProperties = {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: 8,
    textAlign: "left",
    padding: "10px 10px",
    border: "none",
    background: "transparent",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    color: COLORS.text,
  };

  const mobileMenuIcon: CSSProperties = {
    width: 24,
    height: 24,
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  /** HTML body of mobile ⋯ menu (stacking context handled by portal). */
  function renderMobileOverflowMenuMarkup(maxHeight: number) {
    return (
      <div
        role="menu"
        style={{
          background: COLORS.card,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          border: `1px solid ${COLORS.cardStroke}`,
          fontFamily: "system-ui, sans-serif",
          touchAction: "manipulation",
          maxHeight,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: 6,
            paddingBottom: 4,
          }}
        >
          {onNameClick && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                handleNameClick(e as unknown as React.MouseEvent);
              }}
              style={mobileMenuRowStyle}
            >
              <span style={mobileMenuIcon}>
                <SvgActionIcon Icon={PersonIcon} />
              </span>
              View profile
            </button>
          )}
          {onAction &&
            actionButtons.map((b) => (
              <button
                type="button"
                key={b.title}
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onAction(b.action, id);
                }}
                style={mobileMenuRowStyle}
              >
                <span style={mobileMenuIcon}>
                  <SvgActionIcon Icon={b.Icon} />
                </span>
                {b.title}
              </button>
            ))}
        </div>
        <div
          style={{
            flexShrink: 0,
            borderTop: `1px solid ${COLORS.cardStroke}`,
            background: COLORS.card,
            padding: "0 6px 6px",
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
            }}
            style={{
              ...mobileMenuRowStyle,
              width: "100%",
            }}
          >
            <span style={mobileMenuIcon}>
              <SvgActionIcon Icon={IconX} />
            </span>
            Close menu
          </button>
        </div>
      </div>
    );
  }

  const [mobileMenuPos, setMobileMenuPos] = useState<{ left: number; top: number } | null>(null);

  const repositionMobileOverflowMenu = useCallback(() => {
    const rootEl = chartViewportOverlay?.containerRef.current;
    const btnEl = mobileOverflowBtnRef.current;
    if (!menuOpen || !rootEl || !btnEl || !(onAction || onNameClick)) {
      setMobileMenuPos(null);
      return;
    }
    const cr = rootEl.getBoundingClientRect();
    const br = btnEl.getBoundingClientRect();
    const inset = chartViewportOverlay.chromeRightInsetPx;
    let left = br.right - cr.left - MOBILE_OVERFLOW_MENU_W;
    left = Math.max(8, Math.min(left, cr.width - inset - MOBILE_OVERFLOW_MENU_W - 8));
    const top = Math.max(8, br.bottom - cr.top + 4);
    setMobileMenuPos({ left, top });
  }, [menuOpen, chartViewportOverlay, onAction, onNameClick]);

  useLayoutEffect(() => {
    repositionMobileOverflowMenu();
  }, [repositionMobileOverflowMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const t = window.setInterval(repositionMobileOverflowMenu, 48);
    window.addEventListener("resize", repositionMobileOverflowMenu);
    return () => {
      clearInterval(t);
      window.removeEventListener("resize", repositionMobileOverflowMenu);
    };
  }, [menuOpen, repositionMobileOverflowMenu]);

  /** Wider tap target + stop pointer propagation so chart pan/zoom doesn’t steal the gesture. */
  function renderMobileOverflowButton() {
    if (!onAction && !onNameClick) return null;
    const hit = 52;
    const hx = menuCx - hit / 2;
    const hy = menuCy - hit / 2;
    const toggle = (e: React.SyntheticEvent) => {
      e.stopPropagation();
      setMenuOpen((o) => !o);
    };
    return (
      <g
        ref={mobileOverflowBtnRef}
        role="button"
        tabIndex={0}
        aria-label="Open person actions"
        style={{ cursor: "pointer" }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
        }}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }
        }}
      >
        <rect
          x={hx}
          y={hy}
          width={hit}
          height={hit}
          rx={hit / 2}
          fill="rgba(0,0,0,0)"
          pointerEvents="all"
        />
        <circle cx={menuCx} cy={menuCy} r={18} fill={COLORS.iconBg} stroke={COLORS.cardStroke} strokeWidth={1} />
        <IconMoreHorizontal x={menuCx} y={menuCy} size={18} fill={COLORS.iconStroke} />
      </g>
    );
  }

  if (_isShadow) {
    const people = getPeople();
    const primaryUnion = getBirthUnionByChild().get(id);
    const husb = primaryUnion ? people.get(primaryUnion.husb) : null;
    const wife = primaryUnion ? people.get(primaryUnion.wife) : null;
    const primaryLabel =
      husb && wife
        ? `${husb.firstName} & ${wife.firstName}`
        : husb
          ? husb.firstName
          : wife
            ? wife.firstName
            : "elsewhere";

    return (
      <g opacity={0.45}>
        <rect
          x={x}
          y={top}
          width={CARD_W}
          height={effectiveHeight}
          rx={CARD_CORNER_RX}
          fill={COLORS.card}
          stroke={COLORS.cardStroke}
          strokeWidth={1}
          strokeDasharray="5 3"
          style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.08))" }}
        />
        <foreignObject
          x={x + 12}
          y={top + 10}
          width={CARD_W - 24}
          height={30 + NAME_ROW_EXTRA_HEIGHT}
          style={{ overflow: "visible" }}
        >
          <div
            className="font-heading"
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              fontFamily: "var(--font-heading-raw), Georgia, serif",
              color: COLORS.text,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            <span
              role={onNameClick ? "button" : undefined}
              tabIndex={onNameClick ? 0 : undefined}
              onClick={onNameClick ? handleNameClick : undefined}
              onKeyDown={
                onNameClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNameClick(e as unknown as React.MouseEvent);
                      }
                    }
                  : undefined
              }
              style={accentNameSpanStyle({
                whiteSpace: "normal",
                overflow: "visible",
                textOverflow: "clip",
              })}
            >
              {firstName}
              <br />
              {lastName}
            </span>
          </div>
        </foreignObject>
        {effectiveHeight >= 92 && (
          <>
            <text
              x={cx}
              y={top + 56 + NAME_ROW_EXTRA_HEIGHT}
              textAnchor="middle"
              fill={COLORS.date}
              fontFamily="system-ui, sans-serif"
              style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em" }}
            >
              {birthYear ?? "?"} — {deathYear ?? "present"}
            </text>
            <text
              x={cx}
              y={top + effectiveHeight - 10}
              textAnchor="middle"
              fontSize={7.5}
              fill={COLORS.muted}
              fontFamily="Georgia, serif"
              fontStyle="italic"
            >
              shown under {primaryLabel}
            </text>
          </>
        )}
        {onAction && (
          <g
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              onAction("closeLinkedUnion", id);
            }}
            onMouseEnter={(e) =>
              (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.text))
            }
            onMouseLeave={(e) =>
              (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.muted))
            }
          >
            <rect x={x + closeActionHitX} y={top + closeActionHitY} width={22} height={22} fill="transparent" />
            <IconX x={x + closeActionCx} y={top + closeActionCy} size={14} stroke={COLORS.muted} fill="none" />
          </g>
        )}
      </g>
    );
  }

  const isUnknown = firstName === "Unknown" && !_unknownPlaceholder;
  if (isUnknown && settings.showUnknown === false) return null;

  if (isUnknown) {
    return (
      <g opacity={0.5}>
        <rect
          x={x}
          y={top}
          width={CARD_W}
          height={effectiveHeight}
          rx={CARD_CORNER_RX}
          fill={COLORS.card}
          stroke={COLORS.cardStroke}
          strokeWidth={1}
          strokeDasharray="4 3"
          style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.08))" }}
        />
        <foreignObject
          x={x + 12}
          y={y - 22}
          width={CARD_W - 24}
          height={28}
          style={{ overflow: "visible" }}
        >
          <div
            className="font-heading"
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              fontStyle: "italic",
              fontFamily: "var(--font-heading-raw), Georgia, serif",
              color: COLORS.text,
              textAlign: "center",
            }}
          >
            <span
              role={onNameClick ? "button" : undefined}
              tabIndex={onNameClick ? 0 : undefined}
              onClick={onNameClick ? handleNameClick : undefined}
              onKeyDown={
                onNameClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNameClick(e as unknown as React.MouseEvent);
                      }
                    }
                  : undefined
              }
              style={accentNameSpanStyle()}
            >
              Unknown
            </span>
          </div>
        </foreignObject>
        <text
          x={cx}
          y={y + 8}
          textAnchor="middle"
          fill={COLORS.date}
          fontFamily="system-ui, sans-serif"
          style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em" }}
        >
          parent
        </text>
        {onAction && (
          <g
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              onAction("closeSpouse", id);
            }}
            onMouseEnter={(e) =>
              (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.text))
            }
            onMouseLeave={(e) =>
              (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.iconStroke))
            }
          >
            <rect x={x + closeActionHitX} y={top + closeActionHitY} width={22} height={22} fill="transparent" />
            <IconX x={x + closeActionCx} y={top + closeActionCy} size={14} stroke={COLORS.iconStroke} fill="none" />
          </g>
        )}
      </g>
    );
  }

  const personCardVariant = settings.personCardVariant ?? DEFAULT_PERSON_CARD_VARIANT;
  if (
    (personCardVariant === "compact-name" || personCardVariant === "compact-avatar") &&
    !_isShadow
  ) {
    return (
      <CompactPersonCard
        cx={cx}
        y={y}
        x={x}
        top={top}
        effectiveHeight={effectiveHeight}
        person={person}
        isRoot={isRoot}
        isSpouse={isSpouse}
        isLinkedSpouse={isLinkedSpouse}
        hasSpouses={hasSpouses}
        hasParents={hasParents}
        onlyRoot={onlyRoot}
        isLeaf={isLeaf}
        hasDescendantsInData={hasDescendantsInData}
        isSubtreeCollapsed={isSubtreeCollapsed}
        onAction={onAction}
        onNameClick={onNameClick}
        settings={settings}
        actionButtons={actionButtons}
        handleNameClick={handleNameClick}
        overlayPerson={overlayPerson}
        initials={initials}
        variant={personCardVariant}
      />
    );
  }

  const photoUrl = (person.photoUrl ?? "").trim();
  const PersonIcon = person.gender === "Male" ? IconPersonMale : person.gender === "Female" ? IconPersonFemale : IconPerson;

  const closeSpouseG = isSpouse && !isLinkedSpouse && onAction && (
    <g
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        onAction("closeSpouse", id);
      }}
      onMouseEnter={(e) =>
        (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.text))
      }
      onMouseLeave={(e) =>
        (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.iconStroke))
      }
    >
      <rect x={closeActionHitX} y={closeActionHitY} width={22} height={22} fill="transparent" />
      <IconX x={closeActionCx} y={closeActionCy} size={14} stroke={COLORS.iconStroke} fill="none" />
    </g>
  );

  const closeLinkedG = isLinkedSpouse && onAction && (
    <g
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        onAction("closeLinkedUnion", id);
      }}
      onMouseEnter={(e) =>
        (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.text))
      }
      onMouseLeave={(e) =>
        (e.currentTarget as SVGGElement).querySelectorAll("path").forEach((p) => p.setAttribute("stroke", COLORS.muted))
      }
    >
      <rect x={closeActionHitX} y={closeActionHitY} width={22} height={22} fill="transparent" />
      <IconX x={closeActionCx} y={closeActionCy} size={14} stroke={COLORS.muted} fill="none" />
    </g>
  );

  function renderAvatarBlock(avatarCx: number, avatarCy: number, avatarR: number) {
    if (!showPhotos) return null;
    return (
      <>
        <defs>
          <clipPath id={photoClipId}>
            <circle cx={avatarCx} cy={avatarCy} r={avatarR} />
          </clipPath>
        </defs>
        <circle cx={avatarCx} cy={avatarCy} r={avatarR + 4} fill={COLORS.avatarRing} />
        {photoUrl ? (
          <>
            <image
              href={photoUrl}
              x={avatarCx - avatarR}
              y={avatarCy - avatarR}
              width={avatarR * 2}
              height={avatarR * 2}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${photoClipId})`}
            />
            <circle cx={avatarCx} cy={avatarCy} r={avatarR} fill="none" stroke={COLORS.cardStroke} strokeWidth={1} />
          </>
        ) : (
          <>
            <circle cx={avatarCx} cy={avatarCy} r={avatarR} fill={COLORS.avatarRing} stroke={COLORS.cardStroke} strokeWidth={1} />
            {initials.length > 0 ? (
              <text
                x={avatarCx}
                y={avatarCy + avatarR * 0.28}
                textAnchor="middle"
                fontSize={avatarR * 0.85}
                fill={COLORS.text}
                fontFamily="Georgia, serif"
              >
                {initials}
              </text>
            ) : (
              <PersonIcon x={avatarCx} y={avatarCy} size={avatarR * 1.1} fill="none" stroke={COLORS.iconStroke} strokeWidth={1.2} />
            )}
          </>
        )}
      </>
    );
  }

  function renderAvatarBlockNoPhoto(avatarCx: number, avatarCy: number, avatarR: number) {
    if (showPhotos) return null;
    return (
      <g opacity={0.85}>
        <circle cx={avatarCx} cy={avatarCy} r={avatarR * 0.65} fill={COLORS.avatarRing} stroke={COLORS.cardStroke} strokeWidth={1} />
        <text
          x={avatarCx}
          y={avatarCy + 4}
          textAnchor="middle"
          fontSize={12}
          fill={COLORS.muted}
          fontFamily="system-ui, sans-serif"
        >
          …
        </text>
      </g>
    );
  }

  function renderNameBlock(foX: number, foY: number, foW: number, foH: number, textAlign: "center" | "left") {
    return (
      <foreignObject x={foX} y={foY} width={foW} height={foH} style={{ overflow: "visible" }}>
        <div
          className="font-heading"
          title={`${firstName} ${lastName}`}
          style={{
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign,
            padding: `4px 4px ${4 + NAME_UNDERLINE_PX}px 4px`,
            fontSize: textAlign === "center" ? "0.95rem" : "0.9rem",
            fontWeight: 600,
            fontFamily: "var(--font-heading-raw), Georgia, serif",
            color: COLORS.text,
          }}
        >
          <span
            role={onNameClick ? "button" : undefined}
            tabIndex={onNameClick ? 0 : undefined}
            onClick={onNameClick ? handleNameClick : undefined}
            onKeyDown={
              onNameClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNameClick(e as unknown as React.MouseEvent);
                    }
                  }
                : undefined
            }
            style={accentNameSpanStyle()}
          >
            {firstName} {lastName}
          </span>
        </div>
      </foreignObject>
    );
  }

  /** Name + dates as one HTML column so dates sit tight under the name (used by v3 desktop + mobile avatar-left · menu). */
  function renderNameDatesStackBlock(
    foX: number,
    foY: number,
    foW: number,
    foH: number,
    textAlign: "center" | "left",
    typography?: { nameFontSize?: string; dateFontSize?: string; dateLetterSpacing?: string }
  ) {
    const nameFontSize =
      typography?.nameFontSize ?? (textAlign === "center" ? "0.95rem" : "0.9rem");
    return (
      <foreignObject x={foX} y={foY} width={foW} height={foH} style={{ overflow: "visible" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: textAlign === "center" ? "center" : "flex-start",
            justifyContent: "flex-start",
            gap: 2,
            boxSizing: "border-box",
            width: "100%",
            padding: `4px 4px ${4 + NAME_UNDERLINE_PX}px 4px`,
          }}
        >
          <div
            className="font-heading"
            title={`${firstName} ${lastName}`}
            style={{
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
              textAlign,
              fontSize: nameFontSize,
              fontWeight: 600,
              fontFamily: "var(--font-heading-raw), Georgia, serif",
              color: COLORS.text,
              flexShrink: 0,
            }}
          >
            <span
              role={onNameClick ? "button" : undefined}
              tabIndex={onNameClick ? 0 : undefined}
              onClick={onNameClick ? handleNameClick : undefined}
              onKeyDown={
                onNameClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNameClick(e as unknown as React.MouseEvent);
                      }
                    }
                  : undefined
              }
              style={accentNameSpanStyle()}
            >
              {firstName} {lastName}
            </span>
          </div>
          {showDates && (
            <div
              style={{
                flexShrink: 0,
                fontSize: typography?.dateFontSize ?? "0.72rem",
                fontWeight: 600,
                letterSpacing: typography?.dateLetterSpacing ?? "0.06em",
                color: COLORS.date,
                fontFamily: "system-ui, sans-serif",
                whiteSpace: "nowrap",
                textAlign,
                width: "100%",
              }}
            >
              {_unknownPlaceholder ? "—" : birthYear ?? "?"} — {_unknownPlaceholder ? "—" : deathYear ?? "present"}
            </div>
          )}
        </div>
      </foreignObject>
    );
  }

  /** Card interior in local coords 0..CARD_W × 0..baseH (scaled to effectiveHeight). */
  function renderDesktopInterior(variant: LegacyDesktopVariant) {
    if (variant === "v1") {
      const avatarCx = CARD_W / 2;
      const avatarCy = 48;
      const avatarR = 28;
      const nameY = 94;
      const dateY = 118;
      const actionY = baseH - 36;
      return (
        <g>
          {closeSpouseG}
          {closeLinkedG}
          {isRoot && <IconCrown x={crownX} y={crownY} size={18} fill={COLORS.green} stroke={COLORS.green} strokeWidth={1.2} />}
          {renderAvatarBlock(avatarCx, avatarCy, avatarR)}
          {renderAvatarBlockNoPhoto(avatarCx, avatarCy, avatarR)}
          {renderNameBlock(12, nameY - 18, CARD_W - 24, 32 + NAME_ROW_EXTRA_HEIGHT, "center")}
          {showDates && (
            <text
              x={CARD_W / 2}
              y={dateY}
              textAnchor="middle"
              fill={COLORS.date}
              fontFamily="system-ui, sans-serif"
              style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em" }}
            >
              {_unknownPlaceholder ? "—" : birthYear ?? "?"} — {_unknownPlaceholder ? "—" : deathYear ?? "present"}
            </text>
          )}
          {showCardActionIcons && onAction && (
            <ActionIconRow buttons={actionButtons} cy={actionY} cardW={CARD_W} onAction={onAction} personId={id} />
          )}
        </g>
      );
    }
    if (variant === "v2") {
      const CONTENT_W = 250;
      const RAIL_DIVIDER_X = 248;
      const avatarCx = CONTENT_W / 2;
      const avatarCy = 64;
      const avatarR = 28;
      const nameY = 112;
      const dateY = 136;
      return (
        <g>
          {closeSpouseG}
          {closeLinkedG}
          {isRoot && <IconCrown x={crownX} y={crownY} size={18} fill={COLORS.green} stroke={COLORS.green} strokeWidth={1.2} />}
          <line
            x1={RAIL_DIVIDER_X}
            y1={24}
            x2={RAIL_DIVIDER_X}
            y2={baseH - 24}
            stroke={COLORS.divider}
            strokeWidth={1}
          />
          {renderAvatarBlock(avatarCx, avatarCy, avatarR)}
          {renderAvatarBlockNoPhoto(avatarCx, avatarCy, avatarR)}
          {renderNameBlock(10, nameY - 18, CONTENT_W - 20, 32 + NAME_ROW_EXTRA_HEIGHT, "center")}
          {showDates && (
            <text
              x={CONTENT_W / 2}
              y={dateY}
              textAnchor="middle"
              fill={COLORS.date}
              fontFamily="system-ui, sans-serif"
              style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em" }}
            >
              {_unknownPlaceholder ? "—" : birthYear ?? "?"} — {_unknownPlaceholder ? "—" : deathYear ?? "present"}
            </text>
          )}
          {showCardActionIcons &&
            onAction &&
            (() => {
              const overflowThreshold = 3;
              if (actionButtons.length > overflowThreshold) {
                const pair: [ActionBtn, ActionBtn] = [actionButtons[0], actionButtons[1]];
                const rest = actionButtons.slice(2);
                const chrome = overflowMenuChromeStyles();
                return (
                  <>
                    <ActionIconRailAvatarLeftWithOverflow
                      buttons={pair}
                      cardH={baseH}
                      cx={290}
                      onAction={onAction}
                      personId={id}
                      onMoreToggle={() => {
                        setRailOverflowOpenTop((o) => !o);
                        setMenuOpen(false);
                        setRailOverflowOpen(false);
                      }}
                    />
                    {railOverflowOpenTop && rest.length > 0 && (
                      <foreignObject
                        x={CARD_W - 198}
                        y={24}
                        width={186}
                        height={Math.min(48 + rest.length * 40 + 56, 340)}
                        style={{ overflow: "visible", zIndex: 8 }}
                      >
                        <div
                          role="menu"
                          style={{
                            ...chrome.panel,
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            maxHeight: "100%",
                            overflow: "hidden",
                            boxSizing: "border-box",
                            padding: 0,
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              flex: 1,
                              minHeight: 0,
                              overflowY: "auto",
                              WebkitOverflowScrolling: "touch",
                              padding: 6,
                              paddingBottom: 4,
                            }}
                          >
                            {rest.map((b) => (
                              <button
                                type="button"
                                key={`${b.action}-${b.title}`}
                                role="menuitem"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRailOverflowOpenTop(false);
                                  onAction(b.action, id);
                                }}
                                style={chrome.row}
                              >
                                <span style={chrome.icon}>
                                  <SvgActionIcon Icon={b.Icon} />
                                </span>
                                {b.title}
                              </button>
                            ))}
                          </div>
                          <div
                            style={{
                              flexShrink: 0,
                              borderTop: `1px solid ${COLORS.cardStroke}`,
                              background: COLORS.card,
                              padding: "0 6px 6px",
                            }}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRailOverflowOpenTop(false);
                              }}
                              style={{ ...chrome.row, width: "100%" }}
                            >
                              <span style={chrome.icon}>
                                <SvgActionIcon Icon={IconX} />
                              </span>
                              Close menu
                            </button>
                          </div>
                        </div>
                      </foreignObject>
                    )}
                  </>
                );
              }
              return <ActionIconRail buttons={actionButtons} cardH={baseH} cx={290} onAction={onAction} personId={id} />;
            })()}
        </g>
      );
    }
    if (variant === "v3") {
      const avatarCx = 64;
      const avatarR = 34;
      const actionR = 18;
      const actionY = baseH - 29;
      /** Band above bottom action row; avatar + name/dates vertically centered inside it. */
      const contentBandTop = 42;
      const contentBandBot = actionY - actionR - 10;
      const bandMidY = contentBandTop + (contentBandBot - contentBandTop) / 2;
      const avatarCy = bandMidY;
      const avatarOuterR = avatarR + 4;
      const textColLeft = avatarCx + avatarOuterR + 10;
      const textColRight = CARD_W - 14;
      const textColW = Math.max(80, textColRight - textColLeft);
      /** One stacked HTML column (name → dates): padding + rows + gap; matches renderNameDatesStackBlock. */
      const identityPaddingY = 8;
      const identityNameLine = 28;
      const identityDateLine = showDates ? 15 : 0;
      const identityGap = showDates ? 2 : 0;
      const identityH = identityPaddingY + identityNameLine + identityGap + identityDateLine;
      const identityTop = bandMidY - identityH / 2;
      return (
        <g>
          {closeSpouseG}
          {closeLinkedG}
          {isRoot && <IconCrown x={crownX} y={crownY} size={18} fill={COLORS.green} stroke={COLORS.green} strokeWidth={1.2} />}
          {renderAvatarBlock(avatarCx, avatarCy, avatarR)}
          {renderAvatarBlockNoPhoto(avatarCx, avatarCy, avatarR)}
          {renderNameDatesStackBlock(textColLeft, identityTop, textColW, identityH, "center")}
          {showCardActionIcons && onAction && (
            <ActionIconRow buttons={actionButtons} cy={actionY} cardW={CARD_W} onAction={onAction} personId={id} />
          )}
        </g>
      );
    }
    /* v4 */
    const avatarCx = 58;
    const avatarCy = 76;
    const avatarR = 34;
    const textX = 108;
    const nameY = 66;
    const dateY = 90;
    const railDividerX = 258;
    return (
      <g>
        {closeSpouseG}
        {closeLinkedG}
        {isRoot && <IconCrown x={crownX} y={crownY} size={18} fill={COLORS.green} stroke={COLORS.green} strokeWidth={1.2} />}
        <line
          x1={railDividerX}
          y1={18}
          x2={railDividerX}
          y2={baseH - 18}
          stroke={COLORS.divider}
          strokeWidth={1}
        />
        {renderAvatarBlock(avatarCx, avatarCy, avatarR)}
        {renderAvatarBlockNoPhoto(avatarCx, avatarCy, avatarR)}
        {renderNameBlock(textX - 4, nameY - 16, railDividerX - textX - 6, 28 + NAME_ROW_EXTRA_HEIGHT, "left")}
        {showDates && (
          <text
            x={textX}
            y={dateY}
            textAnchor="start"
            fill={COLORS.date}
            fontFamily="system-ui, sans-serif"
            style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em" }}
          >
            {_unknownPlaceholder ? "—" : birthYear ?? "?"} — {_unknownPlaceholder ? "—" : deathYear ?? "present"}
          </text>
        )}
        {showCardActionIcons &&
          onAction &&
          (() => {
            const overflowThreshold = 3;
            if (actionButtons.length > overflowThreshold) {
              const pair: [ActionBtn, ActionBtn] = [actionButtons[0], actionButtons[1]];
              const rest = actionButtons.slice(2);
              const chrome = overflowMenuChromeStyles();
              return (
                <>
                  <ActionIconRailAvatarLeftWithOverflow
                    buttons={pair}
                    cardH={baseH}
                    cx={294}
                    compact
                    onAction={onAction}
                    personId={id}
                    onMoreToggle={() => {
                      setRailOverflowOpen((o) => !o);
                      setMenuOpen(false);
                    }}
                  />
                  {railOverflowOpen && rest.length > 0 && (
                    <foreignObject
                      x={CARD_W - 198}
                      y={24}
                      width={186}
                      height={Math.min(48 + rest.length * 40 + 56, 340)}
                      style={{ overflow: "visible", zIndex: 8 }}
                    >
                      <div
                        role="menu"
                        style={{
                          ...chrome.panel,
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          maxHeight: "100%",
                          overflow: "hidden",
                          boxSizing: "border-box",
                          padding: 0,
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            flex: 1,
                            minHeight: 0,
                            overflowY: "auto",
                            WebkitOverflowScrolling: "touch",
                            padding: 6,
                            paddingBottom: 4,
                          }}
                        >
                          {rest.map((b) => (
                            <button
                              type="button"
                              key={`${b.action}-${b.title}`}
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRailOverflowOpen(false);
                                onAction(b.action, id);
                              }}
                              style={chrome.row}
                            >
                              <span style={chrome.icon}>
                                <SvgActionIcon Icon={b.Icon} />
                              </span>
                              {b.title}
                            </button>
                          ))}
                        </div>
                        <div
                          style={{
                            flexShrink: 0,
                            borderTop: `1px solid ${COLORS.cardStroke}`,
                            background: COLORS.card,
                            padding: "0 6px 6px",
                          }}
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRailOverflowOpen(false);
                            }}
                            style={{ ...chrome.row, width: "100%" }}
                          >
                            <span style={chrome.icon}>
                              <SvgActionIcon Icon={IconX} />
                            </span>
                            Close menu
                          </button>
                        </div>
                      </div>
                    </foreignObject>
                  )}
                </>
              );
            }
            return <ActionIconRail buttons={actionButtons} cardH={baseH} cx={294} compact onAction={onAction} personId={id} />;
          })()}
      </g>
    );
  }

  function renderMobileInterior(mode: "portrait" | "avatarLeft") {
    if (mode === "portrait") {
      const avatarCx = CARD_W / 2;
      const avatarCy = 96;
      const avatarR = 36;
      const nameY = 148;
      const dateY = 176;
      return (
        <g>
          {isRoot && <IconCrown x={crownX} y={crownY} size={18} fill={COLORS.green} stroke={COLORS.green} strokeWidth={1.2} />}
          {renderMobileOverflowButton()}
          {closeSpouseG}
          {closeLinkedG}
          {renderAvatarBlock(avatarCx, avatarCy, avatarR)}
          {renderAvatarBlockNoPhoto(avatarCx, avatarCy, avatarR)}
          {renderNameBlock(16, nameY - 18, CARD_W - 32, 34 + NAME_ROW_EXTRA_HEIGHT, "center")}
          {showDates && (
            <text
              x={CARD_W / 2}
              y={dateY}
              textAnchor="middle"
              fill={COLORS.date}
              fontFamily="system-ui, sans-serif"
              style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em" }}
            >
              {_unknownPlaceholder ? "—" : birthYear ?? "?"} — {_unknownPlaceholder ? "—" : deathYear ?? "present"}
            </text>
          )}
          {menuOpen && (onAction || onNameClick) && !useMobileMenuPortal && (
            <foreignObject
              x={CARD_W - 198}
              y={46}
              width={MOBILE_OVERFLOW_MENU_W}
              height={Math.min(48 + actionButtons.length * 40, 320)}
              style={{ overflow: "visible", zIndex: 5 }}
            >
              {renderMobileOverflowMenuMarkup(Math.min(48 + actionButtons.length * 40 + 72, 360))}
            </foreignObject>
          )}
        </g>
      );
    }
    /* avatarLeft mobile (avatar left · menu): avatar + name/dates stack vertically centered in card */
    const avatarCx = 52;
    const avatarR = 30;
    const avatarOuterR = avatarR + 4;
    const textColLeft = avatarCx + avatarOuterR + 10;
    const textColRight = Math.min(CARD_W - 14, menuCx - 50);
    const textColW = Math.max(72, textColRight - textColLeft);
    const contentBandTop = isRoot ? 44 : 36;
    const contentBandBot = baseH - 12;
    const bandMidY = contentBandTop + (contentBandBot - contentBandTop) / 2;
    const avatarCy = bandMidY;
    const identityPaddingY = 8;
    const identityNameLine = 26;
    const identityDateLine = showDates ? 14 : 0;
    const identityGap = showDates ? 2 : 0;
    const identityH = identityPaddingY + identityNameLine + identityGap + identityDateLine;
    const identityTop = bandMidY - identityH / 2;
    return (
      <g>
        {isRoot && <IconCrown x={crownX} y={crownY} size={18} fill={COLORS.green} stroke={COLORS.green} strokeWidth={1.2} />}
        {renderMobileOverflowButton()}
        {closeSpouseG}
        {closeLinkedG}
        {renderAvatarBlock(avatarCx, avatarCy, avatarR)}
        {renderAvatarBlockNoPhoto(avatarCx, avatarCy, avatarR)}
        {renderNameDatesStackBlock(textColLeft, identityTop, textColW, identityH, "center", {
          nameFontSize: "0.88rem",
          dateFontSize: "0.7rem",
          dateLetterSpacing: "0.05em",
        })}
        {menuOpen && (onAction || onNameClick) && !useMobileMenuPortal && (
          <foreignObject
            x={CARD_W - 198}
            y={40}
            width={MOBILE_OVERFLOW_MENU_W}
            height={Math.min(48 + actionButtons.length * 40, 300)}
            style={{ overflow: "visible" }}
          >
            {renderMobileOverflowMenuMarkup(Math.min(48 + actionButtons.length * 40 + 72, 340))}
          </foreignObject>
        )}
      </g>
    );
  }

  const cardStroke = isRoot ? COLORS.selectedStroke : COLORS.cardStroke;
  const strokeW = isRoot ? 2 : 1;

  const mobilePortalHost =
    useMobileMenuPortal && chartViewportOverlay ? chartViewportOverlay.containerRef.current : null;
  const mobileOverflowMenuPortal =
    menuOpen &&
    renderLayout.mode === "mobile" &&
    useMobileMenuPortal &&
    mobilePortalHost &&
    mobileMenuPos != null &&
    (onAction || onNameClick) &&
    createPortal(
      <div
        style={{
          position: "absolute",
          left: mobileMenuPos.left,
          top: mobileMenuPos.top,
          width: MOBILE_OVERFLOW_MENU_W,
          zIndex: CHART_PERSON_OVERFLOW_MENU_Z_INDEX,
        }}
      >
        {renderMobileOverflowMenuMarkup(Math.min(48 + actionButtons.length * 40 + 72, 380))}
      </div>,
      mobilePortalHost
    );

  return (
    <>
      <g
        style={{ opacity: _unknownPlaceholder ? 0.62 : 1 }}
        onClick={() => {
          setMenuOpen(false);
          setRailOverflowOpenTop(false);
          setRailOverflowOpen(false);
        }}
      >
        <g className="person-card">
          <rect
            x={x}
            y={top}
            width={CARD_W}
            height={effectiveHeight}
            rx={CARD_CORNER_RX}
            fill={COLORS.card}
            stroke={cardStroke}
            strokeWidth={strokeW}
            style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.12))" }}
          />
          {isSpouse && (
            <line x1={x} y1={top + 1} x2={x + CARD_W} y2={top + 1} stroke="var(--tree-spouse, #8b7355)" strokeWidth={1.5} />
          )}
          <g transform={`translate(${x},${top}) scale(1, ${innerScaleY})`}>
            {renderLayout.mode === "mobile"
              ? renderMobileInterior(renderLayout.mobileVariant ?? "avatarLeft")
              : renderDesktopInterior(renderLayout.desktopVariant ?? "v1")}
          </g>
          {_hiddenCount != null && _hiddenCount > 0 && (
            <text
              x={x + CARD_W - 10}
              y={top + effectiveHeight - 8}
              fontSize={14}
              fontWeight={600}
              fill={COLORS.muted}
              fontFamily="Georgia, serif"
              textAnchor="end"
            >
              +{_hiddenCount}
            </text>
          )}
        </g>
      </g>
      {mobileOverflowMenuPortal}
    </>
  );
});
