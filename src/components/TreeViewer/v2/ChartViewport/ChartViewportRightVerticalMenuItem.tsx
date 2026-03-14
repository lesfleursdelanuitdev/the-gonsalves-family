"use client";

export interface ChartViewportRightVerticalMenuItemProps {
  /** Optional aria-label for the group (role="group" is applied when provided). */
  ariaLabel?: string;
  children: React.ReactNode;
}

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  borderRadius: 6,
  background: "var(--tree-panel-bg)",
  border: "1px solid var(--tree-panel-border)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  overflow: "hidden",
};

export function ChartViewportRightVerticalMenuItem({
  ariaLabel,
  children,
}: ChartViewportRightVerticalMenuItemProps) {
  const wrapperProps = ariaLabel
    ? { role: "group" as const, "aria-label": ariaLabel, style: panelStyle }
    : { style: panelStyle };

  return (
    <div className="chart-viewport-right-menu-item" {...wrapperProps}>
      {children}
    </div>
  );
}
