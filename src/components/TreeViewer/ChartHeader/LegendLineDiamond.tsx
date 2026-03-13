"use client";

export function LegendLineDiamond({
  color,
  size = "small",
}: {
  color: string;
  size?: "small" | "medium";
}) {
  const w = size === "medium" ? 32 : 28;
  const h = size === "medium" ? 14 : 12;
  const cy = h / 2;
  const cx = w / 2;
  const d = size === "medium" ? 4 : 3;
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <line x1={0} y1={cy} x2={w} y2={cy} stroke={color} strokeWidth={2} strokeDasharray="5 2" />
      <polygon points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`} fill={color} />
    </svg>
  );
}
