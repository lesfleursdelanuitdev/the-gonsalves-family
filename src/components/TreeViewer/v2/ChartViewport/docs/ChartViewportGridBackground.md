# ChartViewportGridBackground.tsx

Renders a dot-pattern grid as the background of the chart viewport. Rendered inside the same transformed group as ChartContent so it stays aligned with the chart in pan/zoom space.

## Responsibility

- Define an SVG pattern (id chart-grid) with a single dot repeated every 32x32 units.
- Draw a large rect (100000x100000) filled with that pattern.
- Use pointerEvents none so the grid does not capture pointer events.

## Props

None.

## Usage

Rendered as a sibling of ChartContent inside the transformed group in ChartViewport.tsx.
