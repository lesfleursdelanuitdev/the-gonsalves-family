# Plan: TreeViewer v2 State Documentation

Outline for a doc that explains where and how state lives in the v2 family tree. The goal is to give a single place to understand reducer state, UI state, and how they flow through hooks and components.

---

## 1. Audience and goal

- **Audience:** Developers working on TreeViewer v2 or debugging tree behavior.
- **Goal:** Clarify what state exists, who owns it, and how it is updated (reducer vs setState vs external hooks). Not a full API reference—focus on concepts and data flow.

---

## 2. Proposed sections

### 2.1 Overview

- One-sentence summary: v2 state is split into (1) reducer state (tree navigation, view) in `useFamilyTreeState`, (2) local UI state in the same hook, and (3) panel/drawer state from `@/genealogy-visualization-engine` hooks.
- Point to `useFamilyTreeState` as the single state hook consumed by FamilyTree; mention that pan/zoom and fetch/build state live in other hooks (usePanZoom, useDescendancyFetch, useTreeBuild) and are not part of “TreeViewer state” in this doc.

### 2.2 Reducer state (TreeState)

- **Source:** `treeReducer` + `createInitialState("descendancy", initialRootId)` from `@/genealogy-visualization-engine`. Owned inside `useFamilyTreeState`.
- **Shape:** `TreeState`: `strategyName`, `rootId`, `viewState`, `history`, `historyIndex`. Reference `reducer/types.ts` (or doc the shape inline).
- **Updates:** Only via `dispatch(action)`. Core actions (ROOT, BACK, FORWARD, NAVIGATE_TO_INDEX) and strategy actions (e.g. SHOW_CHILDREN, REVEAL_SPOUSE, SET_SIBLING_VIEW_FROM_API) — list main ones or point to genealogy-visualization-engine reducer.
- **Initialization:** `initialRootId` from FamilyTree props → `createInitialState("descendancy", initialRootId)`; changing `initialRootId` only affects mount (no reset on prop change unless FamilyTree remounts).

### 2.3 ViewState (inside reducer state)

- **What it is:** `state.viewState` cast to `ViewState` (from `@/genealogy-visualization-engine` types). Strategy-specific view data for the descendancy chart.
- **Fields to document briefly:** `revealedUnions`, `linkedUnions`, `siblingView`, `displayDepth`, `currentDepth`, `expandDownTopRow`. One line each on purpose (e.g. “which spouse sets are expanded”, “depth used for build/display”, “sibling view metadata from API”).
- **Who reads it:** useTreeBuild, useDepth, usePanToPerson, panels (legend), handlePersonCardAction context. No need to list every consumer—just “used by build, depth, and action handlers”.

### 2.4 Local UI state (in useFamilyTreeState)

- **List each with one line:**
  - `settings` (ChartSettingsV2) — display toggles and behaviour; updated via `updateSetting`.
  - `toast` / `setToast` — toast message or null.
  - `blinkBack` / `triggerBlinkBack` — brief highlight effect (e.g. after navigation).
  - `headerOpen` / `setHeaderOpen` — header expanded/collapsed.
  - `isMobile` — derived from window width (e.g. &lt; 640); resize listener in hook.
  - `rootDisplayNames` / `setRootDisplayNames` — cache of root id → display name (used by useRootDisplayName).
  - `goToPersonDrawerOpen` / `setGoToPersonDrawerOpen` — Go To Person drawer open/closed.
- **Note:** All of this is React useState (or setters from sub-hooks) inside the state hook; no reducer.

### 2.5 Panel and drawer state (external hooks)

- **usePanelVisibility** (from `@/genealogy-visualization-engine`): booleans and setters for showHistoryPanel, showInfo, showSearchPanel, showDepthPanel, showSettings, showLegendModal, showLegendPanel, showDebugPanel; plus toggle/closeAll helpers. Returned as `panels` from useFamilyTreeState.
- **useSpouseDrawer**: drawerPersonId, openDrawer, closeDrawer, setDrawerPersonId. Returned as `spouseDrawer` from useFamilyTreeState.
- **Why here:** TreeViewer doesn’t own the implementation (lives in genealogy-visualization-engine) but owns the single instance by calling these hooks inside useFamilyTreeState and passing `panels` and `spouseDrawer` down.

### 2.6 State that is not in useFamilyTreeState

- **Pan/zoom:** usePanZoom (svgRef, bounds, baseX, baseY) — pan, scale, handlers; called in FamilyTree, passed to ChartViewport.
- **Fetch/build:** useDescendancyFetch, useTreeBuild, useDepth — builder, root node, bounds, depth; called in FamilyTree.
- **Search:** useChartSearch — search fields and results; called in FamilyTree, passed to header and actions.
- **Intent:** Make clear that “TreeViewer state” in this doc means the state hook + reducer + panels/drawer; not every piece of React state in the tree screen.

### 2.7 How FamilyTree uses state

- Short flow: FamilyTree calls `useFamilyTreeState(initialRootId)`, gets state + dispatch + viewState + settings + panels + spouseDrawer + …; calls useFamilyTreeActions with the right slice; passes state/actions to FamilyTreeHeader, ChartViewport, FamilyTreeOverlays. No need for full prop list—just “state and actions flow from the hook into header, viewport, and overlays”.

### 2.8 Derived state (outside the reducer)

- **useTreePeople(root):** list of people for Go To Person drawer; derived from current root, not stored in reducer.
- **useRootDisplayName(rootId, effectiveRootId, rootDisplayNames, setRootDisplayNames):** current root display name; reads/caches via rootDisplayNames. Mention that the hook may update the cache (side effect).
- **Effective depth / displayed depth:** from useDepth (maxDepthRendered, builder); used for settings and display. One sentence: “Depth state for the UI comes from useDepth, which depends on reducer viewState and builder.”

### 2.9 Where to find types and implementations

- **TreeState, ViewState, HistoryEntry, TreeAction:** `@/genealogy-visualization-engine` (reducer/types.ts, types.ts).
- **useFamilyTreeState, ToastState:** `TreeViewer/v2/hooks/useFamilyTreeState.ts`.
- **usePanelVisibility, useSpouseDrawer:** `@/genealogy-visualization-engine` hooks.
- **ChartSettingsV2:** `TreeViewer/v2/ChartPanels/SettingsPanel.tsx`.

---

## 3. Optional additions (if the doc grows)

- **Diagram:** Simple box diagram: useFamilyTreeState (reducer + local + panels + spouseDrawer) → FamilyTree → Header / Viewport / Overlays. Optional.
- **Common actions:** Small “how do I change X?” (e.g. change root → dispatch ROOT or ROOT_KEEP_VIEW; open settings → panels.setShowSettings(true)).
- **Persistence:** If any state is ever persisted (e.g. URL, localStorage), add a short subsection; currently v2 doesn’t persist TreeViewer state in this hook.

---

## 4. File to create

- **Path:** `TreeViewer/v2/docs/STATE.md` (or `TreeViewerState.md`).
- **Reference from:** `TreeViewer/v2/docs/README.md` — add a link under “Top-level docs” or “Structure” so the state doc is discoverable.

---

## 5. What to skip (keep the doc focused)

- Full list of every TreeAction type (point to genealogy-visualization-engine).
- Step-by-step useFamilyTreeActions internals (that’s “actions”, not “state”; a separate doc could cover that).
- Deep dive into usePanZoom / useTreeBuild / useDescendancyFetch (only state ownership and “lives outside useFamilyTreeState”).
- v1 vs v2 state comparison (already in TREEVIEWER_V1_V2_ANALYSIS.md).

---

If this plan looks good, the next step is to draft `STATE.md` (or the chosen name) following this outline.
