"use client";

import type { ReactNode } from "react";

const PILL_BG_DEFAULT = "rgba(229, 220, 200, 0.55)";
/** Toolbar “More” pill: a touch more fill than siblings, still light. */
const PILL_BG_EMPHASIS = "rgba(225, 218, 204, 0.72)";
const PILL_BORDER_DEFAULT = "#e5dcc8";
/** More pill: one shade darker than prior #ebe4d8; still softer than default pills. */
const PILL_BORDER_EMPHASIS = "#e0d6c6";

export interface ChartMenuButtonProps {
  icon: ReactNode;
  onClick: () => void;
  title: string;
  label?: string;
  active?: boolean;
  showLabel?: boolean;
  disabled?: boolean;
  /** Use a marginally darker idle background than sibling toolbar buttons. */
  emphasizeBackground?: boolean;
}

const baseStyle: React.CSSProperties = {
  border: "1px solid var(--tree-border)",
  borderRadius: 6,
  padding: "4px 8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 5,
  flexShrink: 0,
};

export function ChartMenuButton({
  icon,
  onClick,
  title,
  label,
  active = false,
  showLabel = true,
  disabled = false,
  emphasizeBackground = false,
}: ChartMenuButtonProps) {
  const idleBg = emphasizeBackground ? PILL_BG_EMPHASIS : PILL_BG_DEFAULT;
  const idleBorder = emphasizeBackground ? PILL_BORDER_EMPHASIS : PILL_BORDER_DEFAULT;
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      style={{
        ...baseStyle,
        background: active ? "var(--hover-overlay)" : idleBg,
        borderColor: idleBorder,
        color: active ? "var(--tree-root)" : "var(--tree-text-muted)",
        opacity: disabled ? 0.5 : undefined,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.color = "var(--tree-text)";
          e.currentTarget.style.borderColor = emphasizeBackground ? PILL_BORDER_EMPHASIS : PILL_BORDER_DEFAULT;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--tree-text-muted)";
          e.currentTarget.style.borderColor = idleBorder;
        }
      }}
    >
      {icon}
      {showLabel && label != null && (
        <span style={{ fontSize: "inherit", lineHeight: 1.2, whiteSpace: "nowrap" }}>{label}</span>
      )}
    </button>
  );
}
