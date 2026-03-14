"use client";

import type { ReactNode } from "react";
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
  /** When set, applied as fixed position (ignored when isMobile). */
  placement?: ChartPanelPlacement;
  /** When true, container has no position (for use inside overlay). */
  isMobile?: boolean;
  /** "default" = panel-bg + blur; "debug" = surface-dim, no blur. */
  variant?: "default" | "debug";
  minWidth?: number;
  maxWidth?: number;
  maxHeight?: number | string;
  /** Show the bottom Close button. Default true. */
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

export function ChartPanel({
  children,
  title,
  onClose,
  placement,
  isMobile = false,
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

  const positionStyle: React.CSSProperties =
    !isMobile && placement
      ? {
          position: "fixed",
          ...placement,
          zIndex,
        }
      : {};

  const sizeStyle: React.CSSProperties = {};
  if (minWidth != null) sizeStyle.minWidth = minWidth;
  if (maxWidth != null) sizeStyle.maxWidth = maxWidth;
  if (maxHeight != null) sizeStyle.maxHeight = maxHeight;

  const hasHeader = title != null || headerRight != null;

  return (
    <div
      style={{
        ...baseStyle,
        ...positionStyle,
        ...sizeStyle,
        ...containerStyle,
      }}
    >
      {hasHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexShrink: 0,
            marginBottom: 12,
          }}
        >
          {title != null ? <span style={titleStyle}>{title}</span> : <span />}
          {headerRight}
        </div>
      )}
      <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>{children}</div>
      {footer != null && <div style={{ flexShrink: 0, marginTop: 8 }}>{footer}</div>}
      {showCloseButton && (
        <div style={{ flexShrink: 0, marginTop: 8 }}>
          <PanelCloseButton onClick={onClose} style={closeButtonStyle} />
        </div>
      )}
    </div>
  );
}
