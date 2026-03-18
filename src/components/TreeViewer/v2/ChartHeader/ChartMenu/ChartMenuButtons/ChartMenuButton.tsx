"use client";

import type { ReactNode } from "react";

export interface ChartMenuButtonProps {
  icon: ReactNode;
  onClick: () => void;
  title: string;
  label?: string;
  active?: boolean;
  showLabel?: boolean;
  disabled?: boolean;
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
}: ChartMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      style={{
        ...baseStyle,
        background: active ? "var(--hover-overlay)" : "rgba(229, 220, 200, 0.55)",
        borderColor: "#e5dcc8",
        color: active ? "var(--tree-root)" : "var(--tree-text-muted)",
        opacity: disabled ? 0.5 : undefined,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.color = "var(--tree-text)";
          e.currentTarget.style.borderColor = "#e5dcc8";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--tree-text-muted)";
          e.currentTarget.style.borderColor = "#e5dcc8";
        }
      }}
    >
      {icon}
      {showLabel && label != null && <span style={{ fontSize: 12 }}>{label}</span>}
    </button>
  );
}
