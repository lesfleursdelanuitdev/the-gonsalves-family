"use client";

export interface ChartViewportLoadingProps {
  isLoading: boolean;
}

export function ChartViewportLoading({ isLoading }: ChartViewportLoadingProps) {
  if (!isLoading) return null;

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    background: "var(--tree-bg)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  };

  const spinnerStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    border: "3px solid var(--tree-divider)",
    borderTopColor: "var(--crimson)",
    borderRadius: "50%",
    animation: "chart-loading-spin 0.8s linear infinite",
  };

  const textStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "1rem",
    color: "var(--heading)",
    fontFamily: "var(--font-heading-raw), serif",
  };

  return (
    <div style={overlayStyle} aria-live="polite">
      <div style={spinnerStyle} />
      <p style={textStyle}>Loading tree…</p>
    </div>
  );
}
