# ChartViewport

The ChartViewport folder contains the main chart canvas and its overlays: the SVG viewport (pan/zoom, pointer handlers), grid background, loading overlay, right-side controls (zoom, pan, minimap, debug, legend), bottom bar (Go To Person, Toggle All Partners), and the minimap.

All components are used by the v2 family tree at `TreeViewer/v2/FamilyTree.tsx`. State (pan, scale, bounds, etc.) and handlers are owned by the parent; ChartViewport is presentational.

## File index

- **ChartViewport.tsx** — Main container: SVG, transform, loading, minimap, right menu, bottom bar. See [ChartViewport.md](./ChartViewport.md).
- **ChartViewportGridBackground.tsx** — Dot-pattern grid background inside the transformed `<g>`. See [ChartViewportGridBackground.md](./ChartViewportGridBackground.md).
- **ChartViewportLoading.tsx** — Full-viewport loading overlay with spinner. See [ChartViewportLoading.md](./ChartViewportLoading.md).
- **ChartViewportRightVerticalMenu.tsx** — Right-side vertical stack of control panels. See [ChartViewportRightVerticalMenu.md](./ChartViewportRightVerticalMenu.md).
- **ChartViewportRightVerticalMenuItems.tsx** — Builds menu entries (debug, zoom, pan, minimap, legend) from props. See [ChartViewportRightVerticalMenuItems.md](./ChartViewportRightVerticalMenuItems.md).
- **ChartViewportRightVerticalMenuItem.tsx** — Wrapper for a single menu item. See [ChartViewportRightVerticalMenuItem.md](./ChartViewportRightVerticalMenuItem.md).
- **ZoomControls.tsx** — Zoom in / fit to screen / zoom out buttons. See [ZoomControls.md](./ZoomControls.md).
- **PanControls.tsx** — Up/down and left/right pan buttons. See [PanControls.md](./PanControls.md).
- **ChartViewportBottomBar.tsx** — Fixed bottom bar: Go To Person, Toggle All Partners (desktop only). See [ChartViewportBottomBar.md](./ChartViewportBottomBar.md).
- **ChartMinimap.tsx** — Small overview with viewport rect; drag to pan (desktop, when bounds/setPan provided). See [ChartMinimap.md](./ChartMinimap.md).

## Data flow

- **Parent** (`FamilyTree.tsx` or similar) owns: `pan`, `scale`, `bounds`, `setPan`, `svgRef`, and all `on*` handlers.
- **ChartViewport** receives these as props and composes: SVG with transform containing grid + ChartContent; optional minimap; right vertical menu; bottom bar (desktop only).

## CSS / layout notes

- Viewport uses `touchAction: "none"` for pan/zoom.
- Right menu and bottom bar use `position: absolute` / `position: fixed` and CSS variables (`--tree-bg`, `--tree-panel-bg`, etc.).
- Minimap is positioned `right: 16; bottom: 72` with safe-area adjustment on mobile (though minimap is typically hidden on mobile).
