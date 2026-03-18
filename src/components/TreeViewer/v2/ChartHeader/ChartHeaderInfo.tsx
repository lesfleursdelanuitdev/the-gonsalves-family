"use client";

export function ChartHeaderInfo({ isMobile }: { isMobile?: boolean }) {
  if (isMobile) return null;
  return (
    <span style={{ color: "var(--tree-text-subtle)", fontSize: 11 }}>
      scroll to zoom · drag to pan
    </span>
  );
}
