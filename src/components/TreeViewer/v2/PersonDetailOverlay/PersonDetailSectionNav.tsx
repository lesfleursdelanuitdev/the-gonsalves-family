"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Baby,
  BookOpen,
  CalendarDays,
  Compass,
  Cross,
  FileText,
  Images,
  MoreHorizontal,
  Users,
  X,
} from "lucide-react";
import type { PersonOverlayNavId } from "./personDetailNav";
import {
  iconColor,
  profileFooterShellStyle,
  profileFooterSurfaceStyle,
  SECTION_BORDER_RADIUS,
} from "./styles";

const CIRCLE_PX = 44;
const ICON_PX = 20;
const GAP_PX = 8;
const BORDER_SUBTLE = "#d8cfbd";
const CIRCLE_FILL = "#ede4d1";
const CIRCLE_HOVER_FILL = "#d8e0c9";
const CIRCLE_HOVER_BORDER = "#b9c9ad";
const CIRCLE_ACTIVE_FILL = "#cfdcc4";
const CIRCLE_ACTIVE_BORDER = "#7fa06f";

/** Desktop: width budget per labeled action for overflow math. */
const DESKTOP_SLOT_W = 86;
/** Mobile: icon + gap for scroll row. */
const MOBILE_SLOT_W = 50;
const MORE_SLOT_DESKTOP = 72;
const MORE_SLOT_MOBILE = 48;

export type PersonDetailNavItem = { id: PersonOverlayNavId; label: string };

function NavIcon({ id, size = ICON_PX }: { id: PersonOverlayNavId; size?: number }): ReactNode {
  const c = iconColor;
  switch (id) {
    case "birth":
      return <Baby size={size} color={c} aria-hidden />;
    case "death":
      return <Cross size={size} color={c} aria-hidden />;
    case "families":
      return <Users size={size} color={c} aria-hidden />;
    case "sources":
      return <BookOpen size={size} color={c} aria-hidden />;
    case "media":
      return <Images size={size} color={c} aria-hidden />;
    case "events":
      return <CalendarDays size={size} color={c} aria-hidden />;
    case "notes":
      return <FileText size={size} color={c} aria-hidden />;
    case "explore":
      return <Compass size={size} color={c} aria-hidden />;
    default:
      return null;
  }
}

function maxInlineSlots(containerWidth: number, total: number): number {
  if (total <= 0) return 0;
  const slot = DESKTOP_SLOT_W;
  const moreSlot = MORE_SLOT_DESKTOP;
  const widthIfAll = total * slot + Math.max(0, total - 1) * GAP_PX;
  if (widthIfAll <= containerWidth) return total;
  for (let v = total - 1; v >= 1; v--) {
    const need = v * slot + (v - 1) * GAP_PX + GAP_PX + moreSlot;
    if (need <= containerWidth) return v;
  }
  return 0;
}

function circleStyle(active: boolean, hovered: boolean): CSSProperties {
  return {
    width: CIRCLE_PX,
    height: CIRCLE_PX,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: `1px solid ${
      active ? CIRCLE_ACTIVE_BORDER : hovered ? CIRCLE_HOVER_BORDER : BORDER_SUBTLE
    }`,
    backgroundColor: active ? CIRCLE_ACTIVE_FILL : hovered ? CIRCLE_HOVER_FILL : CIRCLE_FILL,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    transition: "background-color 0.15s ease, border-color 0.15s ease",
  };
}

const labelDesktopStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: iconColor,
  textAlign: "center",
  lineHeight: 1.2,
  maxWidth: 100,
};

const dividerStyle: CSSProperties = {
  width: 1,
  flexShrink: 0,
  alignSelf: "stretch",
  minHeight: CIRCLE_PX,
  backgroundColor: BORDER_SUBTLE,
};

export function PersonDetailSectionNav({
  items,
  onJump,
  onClose,
  isMobile = false,
  activeActionId = null,
}: {
  items: PersonDetailNavItem[];
  onJump: (id: PersonOverlayNavId) => void;
  onClose?: () => void;
  isMobile?: boolean;
  /** Highlights the matching jump action after navigation (optional). */
  activeActionId?: PersonOverlayNavId | null;
}) {
  const slotsRef = useRef<HTMLDivElement>(null);
  const moreWrapRef = useRef<HTMLDivElement>(null);
  const itemsKey = items.map((i) => i.id).join(",");

  const [visibleCount, setVisibleCount] = useState(items.length);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const measure = useCallback(() => {
    const el = slotsRef.current;
    if (!el) return;
    if (items.length === 0) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(maxInlineSlots(el.clientWidth, items.length));
  }, [items.length, itemsKey]);

  useLayoutEffect(() => {
    if (isMobile) {
      setVisibleCount(items.length);
      return;
    }
    measure();
  }, [measure, itemsKey, isMobile, items.length]);

  useEffect(() => {
    if (isMobile) return undefined;
    const el = slotsRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, isMobile]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const close = (e: MouseEvent) => {
      const w = moreWrapRef.current;
      if (w && e.target instanceof Node && !w.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [moreOpen]);

  if (items.length === 0) return null;

  const overflow = !isMobile && visibleCount < items.length;
  const inlineItems = overflow ? items.slice(0, visibleCount) : items;
  const menuItems = overflow ? items.slice(visibleCount) : [];

  const handleJump = (id: PersonOverlayNavId) => {
    setMoreOpen(false);
    onJump(id);
  };

  const shellPad = isMobile ? "10px 12px" : "12px 20px 14px";

  const renderJumpButton = (id: PersonOverlayNavId, label: string, key: string) => {
    const active = activeActionId === id;
    const emphasized = hoverKey === key || focusKey === key;
    return (
      <button
        key={key}
        type="button"
        aria-label={`Open ${label}`}
        title={isMobile ? label : undefined}
        onClick={() => handleJump(id)}
        onMouseEnter={() => setHoverKey(key)}
        onMouseLeave={() => setHoverKey((h) => (h === key ? null : h))}
        onFocus={() => setFocusKey(key)}
        onBlur={() => setFocusKey((f) => (f === key ? null : f))}
        style={{
          flex: isMobile ? "0 0 auto" : "1 1 0",
          minWidth: isMobile ? MOBILE_SLOT_W : 0,
          maxWidth: isMobile ? undefined : 120,
          margin: 0,
          border: "none",
          borderRadius: 12,
          background: "transparent",
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: isMobile ? 0 : 6,
          padding: isMobile ? "4px 2px" : "4px 6px 2px",
          boxSizing: "border-box",
          outline: "none",
          color: iconColor,
          boxShadow:
            focusKey === key ? "0 0 0 2px rgba(47, 111, 78, 0.35)" : undefined,
        }}
      >
        <span style={circleStyle(active, emphasized)}>
          <NavIcon id={id} />
        </span>
        {!isMobile ? <span style={labelDesktopStyle}>{label}</span> : null}
      </button>
    );
  };

  const closeButton = onClose ? (
    <button
      key="close"
      type="button"
      aria-label="Close"
      title={isMobile ? "Close" : undefined}
      onClick={onClose}
      onMouseEnter={() => setHoverKey("close")}
      onMouseLeave={() => setHoverKey((h) => (h === "close" ? null : h))}
      onFocus={() => setFocusKey("close")}
      onBlur={() => setFocusKey((f) => (f === "close" ? null : f))}
      style={{
        flex: "0 0 auto",
        margin: 0,
        border: "none",
        borderRadius: 12,
        background: "transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: isMobile ? 0 : 6,
        padding: isMobile ? "4px 2px" : "4px 6px 2px",
        outline: "none",
        color: iconColor,
        boxShadow:
          focusKey === "close" ? "0 0 0 2px rgba(47, 111, 78, 0.35)" : undefined,
      }}
    >
      <span style={circleStyle(false, hoverKey === "close" || focusKey === "close")}>
        <X size={ICON_PX} color={iconColor} aria-hidden strokeWidth={2.25} />
      </span>
      {!isMobile ? <span style={labelDesktopStyle}>Close</span> : null}
    </button>
  ) : null;

  if (isMobile) {
    return (
      <footer
        role="toolbar"
        aria-label="Jump to sections and close"
        style={{
          ...profileFooterShellStyle,
          padding: shellPad,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
          }}
        >
          <div
            ref={slotsRef}
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexWrap: "nowrap",
              alignItems: "center",
              gap: 10,
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
              paddingBottom: 2,
            }}
          >
            {items.map(({ id, label }) => renderJumpButton(id, label, id))}
          </div>
          {closeButton ? (
            <>
              <div style={{ ...dividerStyle, alignSelf: "center", minHeight: 36 }} aria-hidden />
              {closeButton}
            </>
          ) : null}
        </div>
      </footer>
    );
  }

  return (
    <footer
      role="toolbar"
      aria-label="Jump to sections and close"
      style={{
        ...profileFooterShellStyle,
        padding: shellPad,
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          width: "100%",
        }}
      >
        <div
          ref={slotsRef}
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          {inlineItems.map(({ id, label }) => renderJumpButton(id, label, id))}
          {overflow && menuItems.length > 0 ? (
            <div ref={moreWrapRef} style={{ position: "relative", flex: "0 0 auto" }}>
              <button
                type="button"
                aria-label="More sections"
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                onClick={() => setMoreOpen((o) => !o)}
                onMouseEnter={() => setHoverKey("more")}
                onMouseLeave={() => setHoverKey((h) => (h === "more" ? null : h))}
                onFocus={() => setFocusKey("more")}
                onBlur={() => setFocusKey((f) => (f === "more" ? null : f))}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 6px 2px",
                  margin: 0,
                  border: "none",
                  borderRadius: 12,
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  outline: "none",
                  boxShadow:
                    focusKey === "more" ? "0 0 0 2px rgba(47, 111, 78, 0.35)" : undefined,
                }}
              >
                <span style={circleStyle(false, hoverKey === "more" || focusKey === "more")}>
                  <MoreHorizontal size={ICON_PX} color={iconColor} aria-hidden />
                </span>
                <span style={labelDesktopStyle}>More</span>
              </button>
              {moreOpen ? (
                <div
                  role="menu"
                  aria-label="More sections"
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    right: 0,
                    left: "auto",
                    width: "min(280px, 85vw)",
                    marginBottom: 8,
                    maxHeight: 280,
                    overflowY: "auto",
                    ...profileFooterSurfaceStyle,
                    border: `1px solid ${BORDER_SUBTLE}`,
                    borderRadius: SECTION_BORDER_RADIUS,
                    boxShadow: "0 -6px 20px rgba(0,0,0,0.12)",
                    padding: 6,
                    zIndex: 30,
                  }}
                >
                  {menuItems.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleJump(id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        border: "none",
                        borderRadius: 8,
                        background: "transparent",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 14,
                        fontWeight: 500,
                        color: iconColor,
                      }}
                    >
                      <span
                        style={{
                          ...circleStyle(false, false),
                          width: 36,
                          height: 36,
                        }}
                      >
                        <NavIcon id={id} size={16} />
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {closeButton ? (
          <>
            <div style={dividerStyle} aria-hidden />
            {closeButton}
          </>
        ) : null}
      </nav>
    </footer>
  );
}
