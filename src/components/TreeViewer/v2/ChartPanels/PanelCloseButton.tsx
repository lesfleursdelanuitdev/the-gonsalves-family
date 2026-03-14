"use client";

interface PanelCloseButtonProps {
  onClick: () => void;
  style?: React.CSSProperties;
}

export function PanelCloseButton({ onClick, style = {} }: PanelCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        marginTop: 0,
        width: "100%",
        padding: "7px 0",
        background: "var(--hover-overlay)",
        border: "1px solid var(--tree-border)",
        borderRadius: 6,
        color: "var(--tree-text-muted)",
        fontSize: 12,
        fontFamily: "system-ui, sans-serif",
        cursor: "pointer",
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--tree-text)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--tree-text-muted)")}
    >
      Close
    </button>
  );
}
