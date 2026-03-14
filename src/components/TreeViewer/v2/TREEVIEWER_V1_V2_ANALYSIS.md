# TreeViewer v1 vs v2 Analysis

Comparison of the original FamilyTree (v1) and the refactored v2 implementation under `TreeViewer/v2/`.

---

## 1. Architecture Overview

| Aspect | v1 | v2 |
|--------|----|----|
| **Entry** | `FamilyTree.tsx` (~561 lines) | `FamilyTree.tsx` (~359 lines) |
| **State** | useReducer + many useState + usePanelVisibility + useSpouseDrawer inline | `useFamilyTreeState()`: reducer, settings, toast, UI flags, panels, spouse drawer in one hook |
| **Actions** | useMemo/useCallback for onAction, rootActionDeps, panel wrappers inline | `useFamilyTreeActions()`: onAction, rootActionDeps, setShowSearchPanel, onDrawerSelect, etc. |
| **Derived data** | useMemo for treePeople, rootDisplayName; useEffect to cache root name | `useTreePeople(root)`, `useRootDisplayName(...)`; cache logic inside hooks |
| **Loading** | Inline div when `builder == null` (loading or error text) | `<FamilyTreeLoading isLoading={...} />` |
| **Header** | `<ChartHeader />` + `<ChartMenu />` as two siblings in collapsible wrapper | `<FamilyTreeHeader />` (wraps v2 ChartHeader + ChartMenu) |
| **Viewport** | `<ChartViewport />` from `TreeViewer/ChartViewport` | `<ChartViewport />` from `v2/ChartViewport` |
| **Panels & drawers** | Toast, DebugPanel, `<ChartPanels />`, SpouseDrawer, GoToPersonDrawer rendered separately in FamilyTree | `<FamilyTreeOverlays />`: Toast, Debug, History, Info, Settings, Legend, LegendModal, SpouseDrawer, GoToPersonDrawer |

v2 keeps the same external API (descendancy fetch, tree build, pan/zoom, depth) but moves state, actions, and UI composition into dedicated hooks and components. v2 uses **only v2 paths** for header, viewport, panels, drawers, and toast when available.

---

## 2. State and Settings

- **v1**  
  - Reducer: `treeReducer` + `createInitialState("descendancy", initialRootId)`.  
  - Local state: `settings` (includes `defaultRootId`), `toast`, `blinkBack`, `headerOpen`, `isMobile`, `rootDisplayNames`, `goToPersonDrawerOpen`.  
  - Settings type: `ChartSettings` from v1 ChartPanels (showDates, showPhotos, showUnknown, autoLegendModal, **defaultRootId**).

- **v2**  
  - Same reducer/initial state, but owned by `useFamilyTreeState`.  
  - Same local concerns, all returned from `useFamilyTreeState` (plus `panels`, `spouseDrawer`).  
  - Settings: **ChartSettingsV2** only (no `defaultRootId`).  
  - `updateSetting` and `triggerBlinkBack` come from the state hook.

---

## 3. Actions and Callbacks

- **v1**  
  - `onActionContext` (useMemo), `onAction` (useCallback), `onDrawerSelect`, `rootActionDeps` (useMemo), `clearSearchAndClosePanel`, `wrappedSetShowSearchPanel`, `wrappedSetShowDepthPanel` all built in FamilyTree.  
  - `rootActionDeps` includes `getPeople` (for history nav in header).

- **v2**  
  - `useFamilyTreeActions(params)` returns `onAction`, `onDrawerSelect`, `rootActionDeps`, `setShowSearchPanel` (with viewport refresh when closing search).  
  - v2 header has **no history navigation**; `rootActionDeps` does not include `getPeople`.  
  - FamilyTree only wires `actions.onAction`, `actions.rootActionDeps`, `actions.setShowSearchPanel`, etc.

---

## 4. Loading and Error UI

- **v1**  
  - When `builder == null`: one full-area div with either "Loading tree…" or "Unable to load tree. Check your connection or try another root."  
  - No separate component.

- **v2**  
  - `<FamilyTreeLoading isLoading={isDescendancyLoading} />` when there is no builder.  
  - Loading/error copy and layout live in one place; FamilyTree has no loading branch in the main chart layout.

---

## 5. Header and Menu

- **v1**  
  - `ChartHeader` (root name, history nav, legend toggle) and `ChartMenu` (search, depth, history, info, settings, Go To Person, Toggle All Spouses) from `TreeViewer/ChartHeader`.  
  - Both receive many props from FamilyTree; navigation and menu logic are split across two components.

- **v2**  
  - `FamilyTreeHeader` composes v2 `ChartHeader` and `ChartMenu` from `v2/ChartHeader`.  
  - Single prop surface: header open state, root id/display name, view state, panel toggles, search state, `rootActionDeps`, `setShowSearchPanel`, etc.  
  - No history back/forward in v2 header (no HistoryNav).

---

## 6. Chart Viewport

- **v1**  
  - `ChartViewport` from `TreeViewer/ChartViewport`.  
  - Uses `ChartSettings` (v1).  
  - **shiftGoToPersonUp**: when true (e.g. header open on desktop), bottom bar “Go To Person” is shifted up.  
  - Zoom/pan/minimap/legend/debug UI implemented inside that viewport (or its folder).  
  - viewportRefresh from `TreeViewer/viewportRefresh`.

- **v2**  
  - `ChartViewport` from `v2/ChartViewport`.  
  - Uses **ChartSettingsV2**.  
  - **No shiftGoToPersonUp**; bottom bar positioning is fixed.  
  - Same conceptual layout (zoom, pan, minimap, legend, debug) but built from v2 ChartViewport subcomponents.  
  - viewportRefresh from `v2/utils/viewportRefresh`.

---

## 7. Panels and Overlays

- **v1**  
  - **ChartPanels** (single component in `TreeViewer/ChartPanels/index.tsx`): receives all panel visibility and data, computes `infoStats` and `legendItems` internally, renders HistoryPanel, InfoPanel, SettingsPanel, LegendPanel, LegendModal.  
  - DebugPanel and Toast are rendered directly in FamilyTree.  
  - SpouseDrawer and GoToPersonDrawer rendered in FamilyTree when their state is set.  
  - ChartPanels uses **ChartSettings** and v1 panel components.

- **v2**  
  - **FamilyTreeOverlays**: single component that renders ToastMessage, DebugPanel, HistoryPanel, InfoPanel, SettingsPanel, LegendPanel, LegendModal, SpouseDrawer, GoToPersonDrawer.  
  - Stats and legend items are computed in FamilyTreeOverlays (or from props).  
  - All overlay visibility and data passed as props; panels are v2 ChartPanels (SettingsPanel, InfoPanel, etc.).  
  - Uses **ChartSettingsV2** and no `defaultRootId`.

---

## 8. Viewport-Resized Toast

- **v1**  
  - Listens for `TREE_VIEWER_VIEWPORT_RESIZED` and shows a toast (e.g. “Viewport resized”) for a few seconds.

- **v2**  
  - **Does not** listen for `TREE_VIEWER_VIEWPORT_RESIZED` and does not show any viewport-resized toast (per refactor plan).  
  - viewportRefresh is still used (e.g. after closing search/drawers) for layout; only the toast is omitted.

---

## 9. File and Import Summary

- **v1**  
  - FamilyTree imports from `./ChartHeader`, `./ChartViewport`, `./ChartPanels`, `./Misc` (GoToPersonDrawer, SpouseDrawer, ToastMessage), `./viewportRefresh`, `./ChartPanels/DebugPanel`.  
  - ChartPanels index re-exports ChartSettings and DebugPanel and renders History/Info/Settings/Legend + LegendModal.

- **v2**  
  - FamilyTree imports from `./FamilyTreeLoading`, `./FamilyTreeHeader`, `./FamilyTreeOverlays`, `./ChartViewport/ChartViewport`, `./hooks/useFamilyTreeState`, `./hooks/useFamilyTreeActions`, `./hooks/useTreePeople`, `./hooks/useRootDisplayName`, `./utils/viewportRefresh`.  
  - FamilyTreeHeader imports from `./ChartHeader` (v2).  
  - FamilyTreeOverlays imports from v2 ToastMessage, v2 ChartPanels (each panel), v2 ChartHeader LegendModal, v2 ChartDrawers.  
  - No v1 ChartPanels index; no v1 ChartViewport; no v1 Misc.

---

## 10. Summary Table

| Feature | v1 | v2 |
|---------|----|----|
| State consolidation | Scattered in FamilyTree | useFamilyTreeState |
| Action/callback consolidation | Inline in FamilyTree | useFamilyTreeActions |
| Tree people list | useMemo in FamilyTree | useTreePeople(root) |
| Root display name | useMemo + useEffect in FamilyTree | useRootDisplayName(...) |
| Loading UI | Inline div | FamilyTreeLoading |
| Header + menu | ChartHeader + ChartMenu | FamilyTreeHeader (v2 ChartHeader + ChartMenu) |
| History nav in header | Yes (HistoryNav) | No |
| Viewport | TreeViewer/ChartViewport, ChartSettings, shiftGoToPersonUp | v2/ChartViewport, ChartSettingsV2, no shiftGoToPersonUp |
| Panels | ChartPanels index + Debug + Toast + drawers in FamilyTree | FamilyTreeOverlays (all in one) |
| Settings type | ChartSettings (with defaultRootId) | ChartSettingsV2 (no defaultRootId) |
| Viewport-resized toast | Yes | No |
| viewportRefresh | TreeViewer/viewportRefresh | v2/utils/viewportRefresh |

v2 is a thinner, more composable tree: state and actions in hooks, loading and overlays in dedicated components, and a strict use of v2 implementations for header, viewport, panels, and drawers.
