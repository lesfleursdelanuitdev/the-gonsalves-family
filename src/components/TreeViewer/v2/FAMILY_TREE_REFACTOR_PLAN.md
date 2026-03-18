# FamilyTree v2 Refactor Plan

This document describes the plan to rewrite FamilyTree for v2: extraction of loading UI, state/actions hooks, overlay composition, and strict use of v2 components. No viewport-resized toast in v2.

---

## 1. Constraints

### 1.1 Use v2 path when it exists

For the v2 FamilyTree, **every** dependency must use the v2 implementation when one exists under `TreeViewer/v2/` (or other v2 locations). Do not use v1 components in the v2 tree.

**V2 imports (use these in v2 FamilyTree):**

| Concern           | V2 path / component |
|------------------|----------------------|
| Chart header      | `v2/ChartHeader` |
| Chart menu        | `v2/ChartHeader/ChartMenu` |
| Chart viewport    | `v2/ChartViewport/ChartViewport` |
| Chart panels      | `v2/ChartPanels` (HistoryPanel, InfoPanel, SettingsPanel, LegendPanel, DebugPanel, ChartPanel) |
| Chart content     | `v2/ChartContent` |
| Go To Person      | `v2/ChartDrawers/GoToPersonDrawer` |
| Spouse drawer     | `v2/ChartDrawers/SpouseDrawer` |
| Toast             | `v2/ToastMessage` |
| Settings type     | `ChartSettingsV2` from `v2/ChartPanels/SettingsPanel` |

Shared hooks, providers, and lib (e.g. `@/genealogy-visualization-engine`, `@/providers`) stay as-is unless a v2 variant exists.

### 1.2 No viewport-resized toast in v2

The “viewport resized” toast is **not** part of v2.

- Do **not** add a listener for `TREE_VIEWER_VIEWPORT_RESIZED`.
- Do **not** add any effect that calls `setToast` for that event.
- Do **not** add a `useViewportResizeToast` hook in v2.
- Toast may still be used for other reasons (e.g. future messages) if needed.

---

## 2. Refactors (in order)

### 2.1 FamilyTreeLoading

**Goal:** Move loading/error UI into a dedicated component so the main tree does not branch on builder/loading in the layout.

**Current behavior:** When `builder == null`, the tree shows either “Loading tree…” or “Unable to load tree. Check your connection or try another root.”

**New component:**

- **File:** `TreeViewer/v2/FamilyTreeLoading.tsx`
- **Props:** `isLoading: boolean`, optional `message?: string` (for error case).
- **Renders:** Full-area block (flex, centered), same styling as current (background, color, aria-live). Shows “Loading tree…” when `isLoading`, else `message` or the default error text.
- **Usage:** v2 FamilyTree renders `<FamilyTreeLoading isLoading={isDescendancyLoading} message={...} />` when there is no builder; otherwise renders the chart area.

**Acceptance:** Loading and error states are handled only inside FamilyTreeLoading; no inline loading JSX in FamilyTree.

---

### 2.2 useTreePeople

**Goal:** Isolate the derivation of the “Go To Person” list from the tree root so FamilyTree stays thin.

**Current behavior:** A `useMemo` that runs `collectAllPersonNodes(root)`, filters nodes with content, maps to `{ id, firstName, lastName, x?, y? }`, and dedupes by id.

**New hook:**

- **File:** `TreeViewer/v2/hooks/useTreePeople.ts` (or colocate next to FamilyTree if hooks folder is not used).
- **Signature:** `useTreePeople(root: ChartNode): GoToPersonItem[]`
- **Returns:** Same shape as current `treePeople` (id, firstName, lastName, x?, y?).
- **Usage:** v2 FamilyTree does `const treePeople = useTreePeople(root)` and passes `treePeople` to GoToPersonDrawer.

**Acceptance:** No inline useMemo for tree people in FamilyTree; list logic is testable in one place.

---

### 2.3 useRootDisplayName

**Goal:** Encapsulate root display name and its cache so FamilyTree does not own that logic or effect.

**Current behavior:** `rootDisplayName` is derived from `rootDisplayNames[rootId] ?? rootDisplayNames[effectiveRootId]` or from `getPeople().get(effectiveRootId)`. An effect writes the derived name into `rootDisplayNames` when not already stored.

**New hook:**

- **File:** `TreeViewer/v2/hooks/useRootDisplayName.ts`
- **Signature:** `useRootDisplayName(rootId, effectiveRootId, rootDisplayNames, setRootDisplayNames): string | null`
- **Returns:** The display name for the current (effective) root.
- **Side effect:** The hook (or a small helper it uses) updates `rootDisplayNames` when the derived name exists and is not yet cached.
- **Usage:** v2 FamilyTree passes in the reducer’s rootId, effectiveRootId, and the rootDisplayNames state/setter; uses the returned value for header/menu and panels.

**Acceptance:** No rootDisplayName useMemo or cache effect in FamilyTree; display name logic lives in the hook.

---

### 2.4 useFamilyTreeState

**Goal:** Consolidate reducer and local state so FamilyTree has a single place to read/write tree and UI state.

**Scope:**

- Reducer: `treeReducer` with `createInitialState("descendancy", initialRootId)`.
- Local state: settings (ChartSettingsV2 only: no `defaultRootId`), toast, blinkBack, headerOpen, isMobile, rootDisplayNames, goToPersonDrawerOpen.
- Existing hooks: keep using `usePanelVisibility` and `useSpouseDrawer`; the state hook can compose them or FamilyTree composes them and passes into the state hook—designer’s choice. The important part is one clear “state” surface.

**New hook:**

- **File:** `TreeViewer/v2/hooks/useFamilyTreeState.ts`
- **Inputs:** `initialRootId?: string | null` (from props).
- **Returns:** An object containing at least: `state`, `dispatch`, `viewState`, `settings`, `updateSetting`, `toast`, `setToast`, `blinkBack`, `triggerBlinkBack`, `headerOpen`, `setHeaderOpen`, `isMobile`, `rootDisplayNames`, `setRootDisplayNames`, `goToPersonDrawerOpen`, `setGoToPersonDrawerOpen`, plus panel and spouse-drawer state (either from sub-hooks or merged). Use ChartSettingsV2 for settings (no defaultRootId).

**Acceptance:** FamilyTree does not declare useReducer or useState for these; it calls useFamilyTreeState (and possibly usePanelVisibility/useSpouseDrawer if not folded in) and passes the returned values down.

---

### 2.5 useFamilyTreeActions

**Goal:** Centralize all action and callback logic (onAction, drawer select, panel toggles, search/depth panel wrappers, rootActionDeps) so FamilyTree only wires inputs and uses returned callbacks.

**Scope:**

- Build `onActionContext` (HandlePersonCardActionContext) and `onAction`.
- `onDrawerSelect`, `clearSearchAndClosePanel`, wrapped `setShowSearchPanel` / `setShowDepthPanel`, `rootActionDeps`, `updateSetting`, `triggerBlinkBack` (if not returned from state hook).

**New hook:**

- **File:** `TreeViewer/v2/hooks/useFamilyTreeActions.ts`
- **Inputs:** All dependencies these callbacks need: dispatch, viewState, settings, panels, search, spouseDrawer, depth (currentDepthRendered, atMaxDepth, effectiveMaxDepth, handleMaxDepthChange, displayedDepth), panZoom (setPan, goToInitialView), setToast, setRootDisplayNames, scheduleCenterOnPerson, effectiveRootId, etc.
- **Returns:** `onAction`, `onDrawerSelect`, `clearSearchAndClosePanel`, `setShowSearchPanel`, `setShowDepthPanel`, `rootActionDeps`, `updateSetting`, and optionally `triggerBlinkBack` if not from state hook.

**Acceptance:** FamilyTree does not define onActionContext, onAction, onDrawerSelect, or the wrapped panel setters inline; it gets them from useFamilyTreeActions and passes them to header, viewport, and overlays.

---

### 2.6 FamilyTreeOverlays

**Goal:** Single component that renders Toast, DebugPanel, ChartPanels, SpouseDrawer, and GoToPersonDrawer so FamilyTree’s return is “header + main + overlays” without a long list of overlay JSX.

**New component:**

- **File:** `TreeViewer/v2/FamilyTreeOverlays.tsx`
- **Props:** All state and callbacks needed for: ToastMessage, DebugPanel, ChartPanels (history, info, settings, legend), SpouseDrawer, GoToPersonDrawer. Use v2 components only (v2/ChartPanels, v2/ChartDrawers, v2/ToastMessage).
- **Renders:** Exactly one instance of each overlay/panel/drawer with the correct visibility and handlers. No viewport-resized toast logic.
- **Usage:** v2 FamilyTree renders `<FamilyTreeOverlays ... />` once with one (possibly large) props object.

**Acceptance:** No inline ToastMessage, DebugPanel, ChartPanels, SpouseDrawer, or GoToPersonDrawer in FamilyTree; all live inside FamilyTreeOverlays.

---

### 2.7 FamilyTreeHeader

**Goal:** One component for the collapsible top bar: v2 ChartHeader + v2 ChartMenu and the maxHeight transition.

**New component:**

- **File:** `TreeViewer/v2/FamilyTreeHeader.tsx`
- **Props:** headerOpen, onToggleHeader, isMobile, and all props required by v2 ChartHeader and v2 ChartMenu (rootId, rootDisplayName, history if needed for v2, search, panels, onGoToPerson, onToggleAllSpouses, etc.). No history navigation in header for v2.
- **Renders:** Wrapper with `maxHeight: headerOpen ? 120 : 0` (or equivalent) and transition; inside it, v2 ChartHeader and v2 ChartMenu.
- **Usage:** v2 FamilyTree renders `<FamilyTreeHeader ... />` instead of the current header + menu div and components.

**Acceptance:** FamilyTree does not manage the header collapse div or pass headerOpen into two separate components; FamilyTreeHeader owns that layout and uses only v2 header/menu.

---

### 2.8 V2 simplifications (product)

**Applied throughout the refactor:**

- **Settings:** Use ChartSettingsV2 only. No `defaultRootId` in settings or in UI.
- **Header:** No history navigation (back/forward) in v2 ChartHeader; do not pass historyIndex/historyLength/navigationDeps for that.
- **Viewport toast:** No viewport-resized toast (see Constraints).
- **Components:** Use v2 path for every component that has a v2 version (see Constraints).

---

## 3. File layout (target)

```
TreeViewer/v2/
  FAMILY_TREE_REFACTOR_PLAN.md   (this file)
  FamilyTree.tsx                 (v2 entry: composes hooks + FamilyTreeHeader + main + FamilyTreeOverlays)
  FamilyTreeLoading.tsx
  FamilyTreeHeader.tsx
  FamilyTreeOverlays.tsx
  ChartContent.tsx               (existing)
  ChartViewport/                 (existing)
  ChartPanels/                   (existing)
  ChartDrawers/                  (existing)
  ToastMessage.tsx               (existing)
  hooks/
    useTreePeople.ts
    useRootDisplayName.ts
    useFamilyTreeState.ts
    useFamilyTreeActions.ts
```

ChartHeader, ChartMenu, ChartViewport, ChartPanels, ChartDrawers, ToastMessage are existing v2 components; FamilyTree only adds the new files and hooks listed above.

---

## 4. Implementation order

1. **FamilyTreeLoading** – Add component and use it in the v2 tree for loading/error.
2. **useTreePeople** – Add hook; switch v2 FamilyTree to use it for Go To Person list.
3. **useRootDisplayName** – Add hook; switch v2 FamilyTree to use it and remove inline useMemo/effect.
4. **useFamilyTreeState** – Add hook; migrate reducer and local state into it; v2 FamilyTree consumes it only.
5. **useFamilyTreeActions** – Add hook; move onAction, onDrawerSelect, panel wrappers, rootActionDeps into it; v2 FamilyTree consumes it only.
6. **FamilyTreeOverlays** – Add component; move Toast, Debug, ChartPanels, SpouseDrawer, GoToPersonDrawer into it; v2 FamilyTree renders it once.
7. **FamilyTreeHeader** – Add component; wrap v2 ChartHeader + v2 ChartMenu and collapse; v2 FamilyTree renders it once.
8. **Final pass** – Ensure v2 FamilyTree uses only v2 paths, ChartSettingsV2, no viewport-resized toast, and no leftover inline state/callbacks that belong in hooks or overlay/header components.

---

## 5. Acceptance checklist (v2 FamilyTree)

- [ ] Every UI component uses the v2 path when it exists (ChartHeader, ChartMenu, ChartViewport, ChartPanels, ChartContent, ChartDrawers, ToastMessage).
- [ ] No listener or effect for viewport-resized toast; no useViewportResizeToast.
- [ ] Loading/error state is handled only by FamilyTreeLoading.
- [ ] useTreePeople provides the Go To Person list; no inline useMemo for it.
- [ ] useRootDisplayName provides root display name and cache; no inline useMemo/effect for it.
- [ ] useFamilyTreeState holds reducer and local state; FamilyTree does not duplicate them.
- [ ] useFamilyTreeActions provides onAction, onDrawerSelect, panel callbacks, rootActionDeps; FamilyTree does not define them inline.
- [ ] FamilyTreeOverlays renders Toast, Debug, ChartPanels, SpouseDrawer, GoToPersonDrawer.
- [ ] FamilyTreeHeader wraps v2 ChartHeader + v2 ChartMenu and the collapse behavior.
- [ ] Settings use ChartSettingsV2 only (no defaultRootId).
- [ ] No history navigation in the header for v2.

---

*Document version: 1. Plan is design-only; implementation follows this order and checklist.*
