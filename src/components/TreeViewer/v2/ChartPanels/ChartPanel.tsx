"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { PanelCloseButton } from "./PanelCloseButton";

const defaultContainerStyle: React.CSSProperties = {
  background: "var(--tree-panel-bg)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid var(--tree-border)",
  borderRadius: 10,
  padding: "16px 20px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
  fontFamily: "system-ui, sans-serif",
  display: "flex",
  flexDirection: "column",
  gap: 0,
  minHeight: 0,
};

const debugContainerStyle: React.CSSProperties = {
  background: "var(--tree-surface-dim, #F4EFE2)",
  border: "1px solid var(--tree-border, #D9CCB3)",
  borderRadius: 8,
  padding: "12px 16px",
  fontFamily: "monospace",
  fontSize: 12,
  color: "var(--tree-text, #2C2A26)",
  display: "flex",
  flexDirection: "column",
  gap: 0,
  minHeight: 0,
};

const titleStyle: React.CSSProperties = {
  color: "var(--tree-text-muted)",
  fontSize: 10,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  flexShrink: 0,
};

export interface ChartPanelPlacement {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface ChartPanelProps {
  children: ReactNode;
  /** Uppercase muted label above content. */
  title?: string;
  onClose: () => void;
  /** When set, applied as fixed position (ignored when isMobile, unless `drawer`). */
  placement?: ChartPanelPlacement;
  /** When true, container has no position (for use inside overlay). Ignored when `drawer`. */
  isMobile?: boolean;
  /** Right-edge drawer: full viewport height, backdrop, slide-in; body scrolls vertically. */
  drawer?: boolean;
  /** Drawer width on desktop/tablet (capped by `min(..., 100vw)`). Mobile uses full width. Default 400. */
  drawerWidth?: number;
  /** "default" = panel-bg + blur; "debug" = surface-dim, no blur. */
  variant?: "default" | "debug";
  minWidth?: number;
  maxWidth?: number;
  maxHeight?: number | string;
  /** Show the bottom Close button. Default true; drawer mode often sets false when using header ✕. */
  showCloseButton?: boolean;
  closeButtonStyle?: React.CSSProperties;
  /** Optional content in the header row (e.g. inline close ✕). */
  headerRight?: ReactNode;
  /** Merged onto the container. */
  containerStyle?: React.CSSProperties;
  /** z-index when positioned fixed. Default 300. */
  zIndex?: number;
  /** Optional content between scrollable area and close button (e.g. Undo/Redo). */
  footer?: ReactNode;
}

function DrawerHeaderClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close panel"
      style={{
        border: "none",
        background: "transparent",
        color: "var(--tree-text-muted)",
        fontSize: 28,
        lineHeight: 1,
        cursor: "pointer",
        padding: "4px 8px",
        marginRight: -4,
        borderRadius: 8,
      }}
    >
      ×
    </button>
  );
}

export function ChartPanel({
  children,
  title,
  onClose,
  placement,
  isMobile = false,
  drawer = false,
  drawerWidth = 400,
  variant = "default",
  minWidth,
  maxWidth,
  maxHeight,
  showCloseButton = true,
  closeButtonStyle,
  headerRight,
  containerStyle = {},
  zIndex = 300,
  footer,
}: ChartPanelProps) {
  const baseStyle = variant === "debug" ? debugContainerStyle : defaultContainerStyle;

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, onClose]);

  const positionStyle: React.CSSProperties =
    drawer
      ? {}
      : !isMobile && placement
        ? {
            position: "fixed",
            ...placement,
            zIndex,
          }
        : {};

  const sizeStyle: React.CSSProperties = {};
  if (!drawer) {
    if (minWidth != null) sizeStyle.minWidth = minWidth;
    if (maxWidth != null) sizeStyle.maxWidth = maxWidth;
    if (maxHeight != null) sizeStyle.maxHeight = maxHeight;
  }

  const effectiveHeaderRight = drawer ? headerRight ?? <DrawerHeaderClose onClose={onClose} /> : headerRight;
  const hasHeader = title != null || effectiveHeaderRight != null;

  const scrollStyle: React.CSSProperties = {
    flex: "1 1 auto",
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
    touchAction: "pan-y",
  };

  const inner = (
    <>
      {hasHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexShrink: 0,
            marginBottom: drawer ? 14 : 12,
          }}
        >
          {title != null ? <span style={titleStyle}>{title}</span> : <span />}
          {effectiveHeaderRight}
        </div>
      )}
      <div style={scrollStyle}>{children}</div>
      {footer != null && <div style={{ flexShrink: 0, marginTop: 8 }}>{footer}</div>}
      {showCloseButton && (
        <div style={{ flexShrink: 0, marginTop: 8 }}>
          <PanelCloseButton onClick={onClose} style={closeButtonStyle} />
        </div>
      )}
    </>
  );

  if (drawer) {
    const w = isMobile ? "100%" : `min(${drawerWidth}px, 100vw)`;
    const drawerShell: React.CSSProperties = {
      ...baseStyle,
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: w,
      maxWidth: "100vw",
      minWidth: isMobile ? undefined : minWidth,
      height: "100%",
      maxHeight: "100dvh",
      zIndex,
      margin: 0,
      borderRadius: isMobile ? 0 : "14px 0 0 14px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
      animation: "chartPanelDrawerIn 0.24s ease-out",
      willChange: "transform",
      ...containerStyle,
    };

    return (
      <>
        <style>{`
          @keyframes chartPanelDrawerIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.38)",
            zIndex: zIndex - 1,
          }}
          onClick={onClose}
          aria-hidden
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title ?? "Panel"}
          style={drawerShell}
          onClick={(e) => e.stopPropagation()}
        >
          {inner}
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        ...baseStyle,
        ...positionStyle,
        ...sizeStyle,
        ...containerStyle,
      }}
    >
      {inner}
    </div>
  );
}
