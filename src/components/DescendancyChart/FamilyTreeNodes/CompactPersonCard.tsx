"use client";

import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DescendancyPerson, PersonCardAction } from "@/genealogy-visualization-engine";
import { PERSON_WIDTH } from "@/genealogy-visualization-engine";
import {
  CARD_CORNER_RX,
  COLORS,
  COMPACT_AVATAR_PX,
  COMPACT_CARD_FONT_PX,
  DEFAULT_COMPACT_CARD_SIZE,
  type PersonCardVariant,
  type PersonCompactCardSize,
} from "@/lib/person-card-layout";
import {
  CHART_PERSON_OVERFLOW_MENU_Z_INDEX,
  useChartViewportOverlay,
} from "../../TreeViewer/v2/ChartViewport/ChartViewportOverlayContext";
import { IconPerson, IconX } from "../../TreeViewer/Misc/SvgIcons";
import type { ActionBtn, PersonCardSettings } from "./PersonNodeView";

const CARD_W = PERSON_WIDTH;
const MOBILE_OVERFLOW_MENU_W = 186;

function compactDisplayName(person: DescendancyPerson, size: PersonCompactCardSize): string {
  const full = `${person.firstName} ${person.lastName}`.trim() || "Unknown";
  if (size !== "extra-small") return full;
  if (full.length <= 20) return full;
  const fi = (person.firstName?.[0] ?? "").toUpperCase();
  const last = (person.lastName ?? "").trim();
  if (last) return `${fi}. ${last}`.trim();
  return full.slice(0, 18) + "…";
}

function SvgActionIcon({ Icon, stroke = COLORS.iconStroke }: { Icon: ActionBtn["Icon"]; stroke?: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden style={{ display: "block" }}>
      <Icon x={12} y={12} size={18} stroke={stroke} fill="none" />
    </svg>
  );
}

export interface CompactPersonCardProps {
  cx: number;
  y: number;
  x: number;
  top: number;
  effectiveHeight: number;
  person: DescendancyPerson;
  isRoot: boolean;
  isSpouse: boolean;
  isLinkedSpouse: boolean;
  hasSpouses: boolean;
  hasParents: boolean;
  onlyRoot: boolean;
  isLeaf: boolean;
  hasDescendantsInData: boolean;
  isSubtreeCollapsed: boolean;
  onAction?: (action: PersonCardAction, personId: string) => void;
  onNameClick?: (person: { name: string; xref: string; uuid: string | null }) => void;
  settings: PersonCardSettings;
  actionButtons: ActionBtn[];
  handleNameClick: (e: React.MouseEvent) => void;
  overlayPerson: { name: string; xref: string; uuid: string | null };
  initials: string;
  variant: PersonCardVariant;
}

export function CompactPersonCard({
  cx: _cx,
  y,
  x,
  top,
  effectiveHeight,
  person,
  isRoot,
  isSpouse,
  isLinkedSpouse,
  onAction,
  onNameClick,
  settings,
  actionButtons,
  handleNameClick,
  overlayPerson,
  initials,
  variant,
}: CompactPersonCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const chartViewportOverlay = useChartViewportOverlay();
  const portalHostEl = chartViewportOverlay?.containerRef.current ?? null;
  const portalHost: HTMLElement | null =
    portalHostEl ?? (typeof document !== "undefined" ? document.body : null);
  const useFixedMenuPosition = portalHostEl == null;

  const size: PersonCompactCardSize = settings.compactCardSize ?? DEFAULT_COMPACT_CARD_SIZE;
  const fontPx = COMPACT_CARD_FONT_PX[size];
  const displayName = compactDisplayName(person, size);
  const photoUrl = (person.photoUrl ?? "").trim();
  const showAvatar = variant === "compact-avatar";
  const muted = Boolean(person._unknownPlaceholder);
  const hasMenu = Boolean(onAction || onNameClick);
  const showChevron = hasMenu && (actionButtons.length > 0 || onNameClick || (isSpouse && onAction) || (isLinkedSpouse && onAction));
  const showDates = settings.showDates !== false;
  const headerName = `${person.firstName} ${person.lastName}`.trim() || "Unknown";
  const headerDates = `${person._unknownPlaceholder ? "—" : person.birthYear ?? "?"} — ${
    person._unknownPlaceholder ? "—" : person.deathYear ?? "present"
  }`;

  const cardStroke = isRoot ? COLORS.selectedStroke : COLORS.cardStroke;
  const strokeW = isRoot ? 2 : 1;

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

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const repositionMenu = useCallback(() => {
    const btnEl = menuBtnRef.current;
    if (!menuOpen || !portalHost || !btnEl) {
      setMenuPos(null);
      return;
    }
    const br = btnEl.getBoundingClientRect();
    if (useFixedMenuPosition) {
      let left = br.right - MOBILE_OVERFLOW_MENU_W;
      left = Math.max(8, left);
      setMenuPos({ left, top: br.bottom + 4 });
      return;
    }
    const rootEl = chartViewportOverlay?.containerRef.current;
    if (!rootEl) {
      setMenuPos(null);
      return;
    }
    const cr = rootEl.getBoundingClientRect();
    const inset = chartViewportOverlay!.chromeRightInsetPx;
    let left = br.right - cr.left - MOBILE_OVERFLOW_MENU_W;
    left = Math.max(8, Math.min(left, cr.width - inset - MOBILE_OVERFLOW_MENU_W - 8));
    const topPos = Math.max(8, br.bottom - cr.top + 4);
    setMenuPos({ left, top: topPos });
  }, [menuOpen, chartViewportOverlay, portalHost, useFixedMenuPosition]);

  useLayoutEffect(() => {
    repositionMenu();
  }, [repositionMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const t = window.setInterval(repositionMenu, 48);
    window.addEventListener("resize", repositionMenu);
    return () => {
      clearInterval(t);
      window.removeEventListener("resize", repositionMenu);
    };
  }, [menuOpen, repositionMenu]);

  const menuMarkup = (maxHeight: number) => (
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
          flexShrink: 0,
          borderBottom: `1px solid ${COLORS.cardStroke}`,
          background: COLORS.card,
          padding: "8px 10px 6px",
        }}
      >
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.2,
            fontWeight: 600,
            color: COLORS.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {headerName}
        </div>
        {showDates && (
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: COLORS.date,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {headerDates}
          </div>
        )}
      </div>
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
        {isSpouse && !isLinkedSpouse && onAction && (
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              closeMenu();
              onAction("closeSpouse", person.id);
            }}
            style={mobileMenuRowStyle}
          >
            <span style={mobileMenuIcon}>
              <SvgActionIcon Icon={IconX} />
            </span>
            Close spouse
          </button>
        )}
        {isLinkedSpouse && onAction && (
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              closeMenu();
              onAction("closeLinkedUnion", person.id);
            }}
            style={mobileMenuRowStyle}
          >
            <span style={mobileMenuIcon}>
              <SvgActionIcon Icon={IconX} />
            </span>
            Close linked union
          </button>
        )}
        {onNameClick && (
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              closeMenu();
              handleNameClick(e as unknown as React.MouseEvent);
            }}
            style={mobileMenuRowStyle}
          >
            <span style={mobileMenuIcon}>
              <SvgActionIcon Icon={IconPerson} />
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
                closeMenu();
                onAction(b.action, person.id);
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
            closeMenu();
          }}
          style={{ ...mobileMenuRowStyle, width: "100%" }}
        >
          <span style={mobileMenuIcon}>
            <SvgActionIcon Icon={IconX} />
          </span>
          Close menu
        </button>
      </div>
    </div>
  );

  const portal =
    menuOpen && portalHost && menuPos != null && showChevron
      ? createPortal(
          <div
            style={{
              position: useFixedMenuPosition ? "fixed" : "absolute",
              left: menuPos.left,
              top: menuPos.top,
              width: MOBILE_OVERFLOW_MENU_W,
              zIndex: CHART_PERSON_OVERFLOW_MENU_Z_INDEX,
            }}
          >
            {menuMarkup(Math.min(48 + actionButtons.length * 40 + 120, 380))}
          </div>,
          portalHost
        )
      : null;

  const innerPad = 8;
  const row = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: `0 ${innerPad}px`,
      }}
    >
      {showAvatar && (
        <div
          style={{
            width: COMPACT_AVATAR_PX,
            height: COMPACT_AVATAR_PX,
            flexShrink: 0,
            borderRadius: "50%",
            overflow: "hidden",
            border: `1px solid ${COLORS.cardStroke}`,
            background: COLORS.avatarRing,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- inline tree card avatar
            <img
              src={photoUrl}
              alt=""
              width={COMPACT_AVATAR_PX}
              height={COMPACT_AVATAR_PX}
              style={{ display: "block", objectFit: "cover", borderRadius: "50%" }}
            />
          ) : (
            <span
              style={{
                fontSize: Math.round(COMPACT_AVATAR_PX * 0.38),
                fontWeight: 600,
                color: COLORS.text,
                fontFamily: "Georgia, serif",
              }}
            >
              {initials || "?"}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        className="font-heading"
        onClick={(e) => {
          e.stopPropagation();
          if (onNameClick) handleNameClick(e);
        }}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          background: "transparent",
          padding: 0,
          margin: 0,
          cursor: onNameClick ? "pointer" : "default",
          textAlign: "left",
          fontSize: fontPx,
          fontWeight: 600,
          fontFamily: "var(--font-heading-raw), Georgia, serif",
          color: COLORS.green,
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: muted ? 0.72 : 1,
        }}
      >
        {displayName}
      </button>
      {person._hiddenCount != null && person._hiddenCount > 0 && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: COLORS.muted,
            flexShrink: 0,
          }}
        >
          +{person._hiddenCount}
        </span>
      )}
      {showChevron && (
        <button
          ref={menuBtnRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`Open actions for ${overlayPerson.name}`}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: 6,
            border: `1px solid ${COLORS.cardStroke}`,
            background: COLORS.iconBg,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            color: COLORS.iconStroke,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <>
      <g
        style={{ opacity: muted ? 0.78 : 1 }}
        onClick={() => {
          setMenuOpen(false);
        }}
      >
        <g className="person-card person-card--compact">
          <rect
            x={x}
            y={top}
            width={CARD_W}
            height={effectiveHeight}
            rx={CARD_CORNER_RX}
            fill={COLORS.card}
            stroke={cardStroke}
            strokeWidth={strokeW}
            style={{
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))",
            }}
          />
          {isSpouse && (
            <line
              x1={x}
              y1={top + 1}
              x2={x + CARD_W}
              y2={top + 1}
              stroke="var(--tree-spouse, #8b7355)"
              strokeWidth={1.5}
            />
          )}
          <foreignObject x={x} y={top} width={CARD_W} height={effectiveHeight} style={{ overflow: "visible" }}>
            <div
              style={{
                width: CARD_W,
                height: effectiveHeight,
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
              }}
            >
              {row}
            </div>
          </foreignObject>
        </g>
      </g>
      {portal}
    </>
  );
}
