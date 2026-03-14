"use client";

/**
 * Grid background (dot pattern) for the chart viewport.
 * Renders a fragment to be composed inside the same transformed <g> as ChartContent.
 */
export function ChartViewportGridBackground() {
  return (
    <>
      <defs>
        <pattern
          id="chart-grid"
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          width={32}
          height={32}
        >
          <circle
            cx={16}
            cy={16}
            r={1.5}
            fill="var(--tree-text-subtle)"
            opacity={0.28}
          />
        </pattern>
      </defs>
      <rect
        x={-50000}
        y={-50000}
        width={100000}
        height={100000}
        fill="url(#chart-grid)"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}
