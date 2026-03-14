# ChartMinimap.tsx

Small overview of the full graph in the lower-right. Draws a rectangle representing the current viewport; dragging that rectangle updates the main chart pan via `setPan`. Optional close button hides the minimap (re-open via right menu).

## Responsibility

- Measure the main SVG viewport size via `svgRef` and `ResizeObserver`.
- Compute minimap scale from `bounds` (minX, maxX, maxY) to fixed preview size (140×100).
- Draw a filled rect for the full bounds and a second rect (stroke + semi-transparent fill) for the current viewport in graph coordinates.
- On pointer down on the minimap SVG, capture pointer and store drag start (pan position and client coords). On move, compute delta in graph space and call `setPan` so the main viewport pans accordingly. On pointer up/leave/cancel, release capture and clear drag state.
- If `onClose` is provided, show a close button that calls it (used when minimap is shown and parent wants user to be able to hide it).

## Props (ChartMinimapProps)

| Prop | Type | Description |
|------|------|-------------|
| `bounds` | `{ minX, maxX, maxY } \| null` | Full graph bounds; required for rendering. |
| `baseX`, `baseY` | `number` | Same as main viewport transform origin. |
| `pan` | `{ x: number; y: number }` | Current pan (used for viewport rect and drag math). |
| `scale` | `number` | Current zoom scale. |
| `setPan` | `(pan) => void` | Called to update pan when user drags the viewport rect. |
| `svgRef` | `RefObject<SVGSVGElement \| null>` | Main chart SVG; used to read viewport width/height. |
| `onClose` | `() => void?` | If set, show close button that hides the minimap. |

## Layout

- Container: `position: absolute`, `right: 16`, `bottom: 72`, 140×100, rounded, panel styling. On small screens, bottom offset includes `env(safe-area-inset-bottom)`.
- Close button: top-right inside container; on mobile, larger touch target (44×44).

## Usage

Rendered by `ChartViewport.tsx` when `bounds` and `setPan` are provided and not mobile, and when local state `minimapOpen` is true. Parent passes bounds and setPan from graph layout; ChartViewport manages minimap open/close state and passes `onClose` so the user can hide the minimap.
