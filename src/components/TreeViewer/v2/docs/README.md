# TreeViewer v2

Refactored family tree implementation. State and actions live in hooks; the main tree composes loading, header, viewport, and overlays. v2 uses only v2 components (no v1 imports when a v2 path exists).

## Top-level docs

- [FAMILY_TREE_REFACTOR_PLAN.md](../FAMILY_TREE_REFACTOR_PLAN.md) — Refactor plan, constraints, and v2 import map.
- [TREEVIEWER_V1_V2_ANALYSIS.md](../TREEVIEWER_V1_V2_ANALYSIS.md) — Comparison of v1 and v2 (architecture, state, viewport, panels).
- [STATE.md](./STATE.md) — TreeViewer v2 state: reducer, local UI, panels/drawers, flow diagram, common actions, persistence.

## Structure

- **FamilyTree.tsx** — Entry: composes FamilyTreeLoading, FamilyTreeHeader, ChartViewport, FamilyTreeOverlays; uses useFamilyTreeState, useFamilyTreeActions, useTreePeople, useRootDisplayName.
- **FamilyTreeLoading.tsx** — Full-area loading/error UI when builder is null.
- **FamilyTreeHeader.tsx** — Wraps v2 ChartHeader + ChartMenu (search, depth, panels, Go To Person, Toggle All Spouses).
- **FamilyTreeOverlays.tsx** — Toast, Debug, History, Info, Settings, Legend panels, LegendModal, SpouseDrawer, GoToPersonDrawer.
- **hooks/** — useFamilyTreeState, useFamilyTreeActions, useTreePeople, useRootDisplayName.
- **utils/viewportRefresh.ts** — Viewport refresh event and dispatcher (no viewport-resized toast in v2).
- **ChartViewport/** — SVG viewport, grid, loading overlay, zoom/pan/minimap, bottom bar. See [ChartViewport/docs](../ChartViewport/docs/README.md).
- **ChartPanels/** — ChartPanel, PanelCloseButton, SettingsPanel, InfoPanel, HistoryPanel, LegendPanel, DebugPanel. See [ChartPanels/docs](../ChartPanels/docs/README.md).
- **ChartHeader/** — ChartHeader, ChartMenu, DepthDropdown, DatabaseSearchbox, LegendModal, etc.
- **ChartDrawers/** — GoToPersonDrawer, SpouseDrawer, ChartDrawer base.
- **ChartContent.tsx** — Renders tree from root node (from v2).
- **ToastMessage.tsx** — v2 toast component.
- **SvgIcons/** — Shared icons (e.g. LegendLineDiamond).

## Settings

v2 uses **ChartSettingsV2** from `ChartPanels/SettingsPanel` (showDates, showPhotos, showUnknown, autoLegendModal). No defaultRootId.
