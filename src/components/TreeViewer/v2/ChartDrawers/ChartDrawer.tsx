"use client";

import type { ReactNode } from "react";

export type ChartDrawerAnchor = "left" | "right" | "bottom";

export interface ChartDrawerProps {
  /** Whether the drawer is visible. */
  open: boolean;
  /** Edge from which the drawer slides in. */
  anchor?: ChartDrawerAnchor;
  /** Drawer content. */
  children: ReactNode;
  /** Optional callback when the drawer requests close (e.g. overlay click, escape). */
  onClose?: () => void;
  /** When true, show a backdrop that closes the drawer on click. Default true when onClose is provided. */
  showBackdrop?: boolean;
  /** Optional inline styles. */
  style?: React.CSSProperties;
  /** z-index for drawer and backdrop. Default 400. */
  zIndex?: number;
}

const anchorStyles: Record<
  ChartDrawerAnchor,
  { position: React.CSSProperties; transformOpen: string; transformClosed: string }
> = {
  left: {
    position: { top: 0, left: 0, bottom: 0 },
    transformOpen: "translateX(0)",
    transformClosed: "translateX(-100%)",
  },
  right: {
    position: { top: 0, right: 0, bottom: 0 },
    transformOpen: "translateX(0)",
    transformClosed: "translateX(100%)",
  },
  bottom: {
    position: { left: 0, right: 0, bottom: 0 },
    transformOpen: "translateY(0)",
    transformClosed: "translateY(100%)",
  },
};

const defaultDrawerStyle: React.CSSProperties = {
  position: "fixed",
  background: "var(--tree-panel-bg)",
  border: "1px solid var(--tree-panel-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
  overflow: "auto",
  transition: "transform 0.25s ease-out",
};

export function ChartDrawer({
  open,
  anchor = "right",
  children,
  onClose,
  showBackdrop = Boolean(onClose),
  style = {},
  zIndex = 400,
}: ChartDrawerProps) {
  const { position, transformOpen, transformClosed } = anchorStyles[anchor];
  const drawerStyle: React.CSSProperties = {
    ...defaultDrawerStyle,
    ...position,
    width: anchor === "bottom" ? "100%" : 320,
    maxWidth: anchor === "bottom" ? "100%" : "min(90vw, 400px)",
    height: anchor === "bottom" ? "auto" : "100%",
    maxHeight: anchor === "bottom" ? "80vh" : undefined,
    transform: open ? transformOpen : transformClosed,
    zIndex: zIndex + 1,
    ...style,
  };

  const backdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    opacity: open ? 1 : 0,
    pointerEvents: open && showBackdrop ? "auto" : "none",
    transition: "opacity 0.25s ease-out",
    zIndex,
  };

  return (
    <>
      {showBackdrop && (
        <div
          role="presentation"
          aria-hidden
          style={backdropStyle}
          onClick={onClose}
        />
      )}
      <div style={drawerStyle} role="dialog" aria-modal={showBackdrop}>
        {children}
      </div>
    </>
  );
}
