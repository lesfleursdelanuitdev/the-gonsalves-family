# Plan: FamilyTree decomposition, strategy registry, and chart-only PersonDisplay architecture

This document plans refactors for the v2 tree viewer (`FamilyTree.tsx`, strategy branching, `TreeNodeViewFactory` alignment) and records the current PersonDisplay architecture direction from brainstorming.

Primary goals:

- Easier navigation and maintenance in `FamilyTree`.
- Fewer scattered `chartStrategy` checks.
- A consistent strategy registration story.
- A clear, chart-only `PersonDisplay` boundary for tree nodes and fan cells.

Unless noted, these changes should avoid user-visible behavior changes (except incidental bug fixes).

---

## 0. Decisions from brainstorming (now in scope)

These are agreed constraints and should drive implementation choices:

1. **PersonDisplay scope is chart-only.**
   - Included: `PersonNode` displays in descendancy/pedigree/vertical pedigree, and `PersonCell` displays in fan chart.
   - Excluded: `PersonDetailOverlay`, and anything that functions as a "more" menu while showing person data (e.g. fan peek modal).

2. **Use canonical strategy enums only.**
   - Keep `ChartViewStrategyName` values:
     - `descendancy`
     - `pedigree`
     - `vertical_pedigree`
     - `fan_chart`

3. **Use strategy-scoped display variants.**
   - Avoid one flat global variant namespace where impossible combinations are representable.
   - Variant validity is determined by strategy, with a strict mobile subset per strategy.

4. **PersonDisplay is a shared interface with non-identical implementations.**
   - `PersonNode` and `PersonCell` are both `PersonDisplay` instances.
   - They share contract shape, not rendering internals.

5. **Render contract.**
   - Given strategy, layout, person data, and actions, render the person display for the chart surface.
   - Rendering should be pure with respect to supplied inputs.

---

## 1. Decompose `FamilyTree.tsx`

### Problem

`FamilyTree.tsx` orchestrates fetching, depth, pan/zoom side effects, URL/chart switching, FAMC picker, fan peek, overlays, and header wiring. That concentrates risk and makes strategy-related edits easy to get wrong.

### Approach

Extract **cohesive units** into colocated hooks and small modules under `v2/hooks/` or `v2/family-tree/` (pick one convention and stick to it). Keep `FamilyTree` as the composition root: props in, JSX out; minimal inline logic.

### Suggested extractions (order matters: dependencies first)

| Unit | Suggested location | Responsibility |
|------|--------------------|----------------|
| Families-as-child cache + `loadFamiliesAsChild` | `v2/hooks/useFamiliesAsChildLoader.ts` (or `v2/family-tree/useFamiliesAsChildLoader.ts`) | Refs for cache/inflight, normalized xref keying, fetch to `/api/tree/individuals/.../families-as-child`. |
| Pedigree FAMC picker state + open/close helpers | `v2/hooks/usePedigreeFamcPicker.ts` | State shape currently inline in `FamilyTree`; setters; optional callbacks when pick completes (if not already centralized). |
| Fan peek modal state + handlers that only depend on fan + actions | `v2/hooks/useFanPersonPeek.ts` | `fanPeek` / `setFanPeek`, handlers that call `dispatch`, `setFanPeek`, overlay, `actions.onAction`, etc. |
| Chart strategy change + URL / famc resolution | `v2/hooks/useChartStrategyChange.ts` | The large `handleChartStrategyChange` async flow: `loadFamiliesAsChild`, `SET_VIEW_STRATEGY`, multi-family picker branches. Depends on loader + dispatch + view state. |
| Pan / “home” coupling to strategy | Keep in `FamilyTree` **or** `v2/hooks/useChartViewportPanEffects.ts` | Effects keyed on `boundsKey`, `panToPersonId`, `chartStrategy`, `goToInitialView`, `scheduleCenterOnPerson`. Document deps clearly if extracted. |

### Constraints

- **No behavior change** in phase 1: move code, preserve call order and dependency arrays.
- After each extraction, run `npx tsc --noEmit` and smoke-test: descendancy, horizontal pedigree, vertical pedigree, fan; FAMC picker; fan peek “choose parent family” if applicable.
- Prefer **one PR per extraction** (or two small ones) so review stays tractable.

### Done when

- `FamilyTree.tsx` is roughly **under ~400 lines** (guideline, not a hard rule) and reads as wiring only.
- No new circular imports between hooks and `FamilyTree`.
- Existing tests / manual checklist still pass.

---

## 2. Central chart-strategy registry (app layer)

### Problem

The same facts appear in many places: `isAncestorChart`, which strategies use pedigree FAMC, fetch depth caps, `TreeNodeViewProvider` name, header title strings, etc. That invites drift (e.g. forgetting fan in one branch).

### Approach

Add a **single module** that describes each `ChartViewStrategyName` the app supports. Consumers import helpers or the table row instead of open-coding triple ORs.

### Suggested file

- `v2/chartStrategy/chartStrategyMeta.ts` (or `lib/chartStrategyMeta.ts` if you want it reusable outside TreeViewer)

### Suggested shape (illustrative—adjust to real needs)

```ts
export type ChartStrategyMeta = {
  /** API / builder: ancestor-style fetch (pedigree, vertical, fan). */
  isAncestorChart: boolean;
  /** Uses pedigree FAMC state + picker flows. */
  usesPedigreeFamc: boolean;
  /** Max depth for chart fetch (pedigree cap vs descendancy). */
  fetchDepthKind: "pedigree_capped" | "descendancy";
  /** Key passed to TreeNodeViewProvider / factory (fan may stay special—see §3). */
  treeNodeViewStrategyKey: "descendancy" | "pedigree" | "vertical_pedigree" | "fan_chart";
  /** Person display family: tree node cards vs fan cells. */
  personDisplayFamily: "tree" | "fan";
  /** Strategy-scoped display variants allowed for this strategy. */
  allowedDisplayVariants: readonly PersonDisplayVariantId[];
  /** Strict mobile subset for this strategy. */
  mobileDisplayVariants: readonly PersonDisplayVariantId[];
};

export const CHART_STRATEGY_META: Record<ChartViewStrategyName, ChartStrategyMeta> = { ... };

export function isAncestorChartStrategy(name: ChartViewStrategyName): boolean;
```

### Migration strategy

1. Introduce `CHART_STRATEGY_META` and helpers **without** deleting old checks.
2. Replace call sites **one file at a time**: `FamilyTree.tsx`, `useFamilyTreeActions.ts`, `ChartContent.tsx`, `ChartHeaderTitle.tsx`, `useChartViewFetch` callers, settings panels, etc.
3. Remove dead duplicated conditionals once `tsc` is clean.

### Done when

- No remaining `state.strategyName === "pedigree" || ... || "fan_chart"` triplets for “ancestor chart” (use helper or meta flag).
- New strategy (hypothetical) would require **one row** in the registry plus strategy-specific UI—not N scattered edits.
- Registry is also the source of truth for strategy-to-PersonDisplay wiring (family + variant policy).

### Risks

- Over-meta: if a flag is only used once, it can stay local. The registry should hold **cross-cutting** facts only.

---

## 3. Register `fan_chart` in `TreeNodeViewFactory`

### Problem / inconsistency

`TreeNodeViewProvider` receives `strategyName={chartStrategy}` including `fan_chart`, but `getTreeNodeViewSet("fan_chart")` is undefined. Context falls back to descendancy. That works today because `ChartContent` **never** uses the factory path for fan (it renders `FanChartContent` first). The fallback is implicit and easy to misunderstand.

### Options (pick one in implementation)

**Option A — Explicit registration, same as pedigree (recommended if fan ever shares connectors)**

- Add `TreeNodeViewFactory/fanChart.ts` that registers connector + node components **only if** fan is refactored to use `TreeNodes` + the same connector pipeline. **Not** the first step today.

**Option B — Register a dedicated “fan” set with no-op or minimal stubs (not recommended)**

- Would break type expectations or invite dead code unless `TreeNodes` can accept empty connectors cleanly.

**Option C — Register `fan_chart` → same set as descendancy explicitly (documentation registration)**

- `registerTreeNodeViewSet("fan_chart", getTreeNodeViewSet("descendancy")!)` or duplicate registration of the same object reference.
- **Purpose:** `getTreeNodeViewSet("fan_chart")` is defined; remove reliance on context fallback for fan.
- **Caveat:** Still misleading if someone removes the `ChartContent` early return and expects fan-specific connectors.

**Option D — Keep factory three-way; fix `TreeNodeViewContext` fallback rule (minimal)**

- Document: “`fan_chart` uses `FanChartContent`; context fallback to descendancy is intentional.”
- Optionally pass `strategyName` to context as `chartStrategy === "fan_chart" ? "descendancy" : chartStrategy` so the **context** never sees `fan_chart`. Then factory and provider always align.

### Recommended plan for §3 (pragmatic)

1. **Short term (this refactor track):** Implement **Option D** or **Option C**:
   - **D:** Provider gets a **resolved** view key (`fan_chart` → `descendancy` for node-view purposes only). Document in `TreeNodeViewContext.tsx` and `ChartContent.tsx`.
   - **C:** Explicit `registerTreeNodeViewSet("fan_chart", descendancySet)` in `TreeNodeViewFactory/index.ts` after descendancy registers, with a one-line comment: “Fan renders via `FanChartContent`; this entry exists so lookups are explicit.”
2. **Do not** force fan through `ConnectorLines` / `TreeNodes` unless product asks for unified rendering.
3. If later fan shares more with node tree, revisit **Option A**.

### Done when

- No silent `?? getTreeNodeViewSet("descendancy")` for fan without explanation **or** provider passes a resolved key with a comment.
- `grep fan_chart` across `TreeNodeViewFactory` and context shows an intentional story.

---

## 4. Chart-only PersonDisplay architecture

### Scope boundary

`PersonDisplay` includes only chart-surface person rendering:

- Tree strategies: `PersonNode` renderings (descendancy, pedigree, vertical pedigree).
- Fan strategy: `PersonCell` renderings.

Out of scope for this interface:

- `PersonDetailOverlay`.
- "More" / peek menu surfaces that include person data (including fan peek).

### Shared interface (conceptual contract)

```ts
type PersonDisplay = {
  viewStrategy: ChartViewStrategyName;
  displayVariant: PersonDisplayVariantId;
  personData: PersonDisplayData;
  layout: PersonDisplayLayout;
  actions: PersonDisplayActionState[];
  render: (ctx: PersonDisplayRenderContext) => React.ReactNode;
};
```

Key rule: implementations share this contract but are not required to share rendering internals.

### Strategy-scoped variants

Variants must be namespaced by strategy/surface so invalid combinations cannot be represented.

Example shape:

```ts
type PersonDisplayVariantId =
  | "tree.full.avatarTopActionsBottom"
  | "tree.full.avatarTopActionsRight"
  | "tree.full.avatarLeftActionsBottom"
  | "tree.full.avatarLeftActionsRight"
  | "tree.full.avatarTopMobileMenu"
  | "tree.full.avatarLeftMobileMenu"
  | "tree.compact.name.large"
  | "tree.compact.name.medium"
  | "tree.compact.name.small"
  | "tree.compact.name.extraSmall"
  | "tree.compact.avatar.large"
  | "tree.compact.avatar.medium"
  | "tree.compact.avatar.small"
  | "tree.compact.avatar.extraSmall"
  | "fan.cell.default";
```

The exact IDs can be adjusted, but they must remain strategy-scoped and aligned with registry policy. Prefer names that map directly to current card-layout terms (`avatarTopMobileMenu`, `avatarLeftMobileMenu`) to avoid drift.

### Factory map (target)

- **ViewStrategyRegistry** (source of truth):
  - strategy registration, capabilities, allowed variants, mobile subset, strategy family.
- **PersonDisplayVariantFactory**:
  - resolves requested settings into a valid variant, enforcing mobile subset.
- **PersonDisplayDataFactory**:
  - normalizes chart person data (name, dates, avatar, metadata).
- **PersonDisplayLayoutFactory**:
  - adapts strategy geometry to a `PersonDisplay` layout contract.
- **PersonDisplayActionsFactory**:
  - resolves action availability + disabled states.
- **PersonDisplayRendererFactory**:
  - picks concrete renderer implementation (`PersonNode` family vs `PersonCell` family).
- **ConnectorRegistry / ConnectorFactory**:
  - resolves connector rendering policy per strategy (`tree connectors` vs `none`).
- **PersonDisplayFactory**:
  - composition root assembling full `PersonDisplay`.

### Connector handling (new explicit track)

Current behavior in code:

- Engine descriptors already expose connector geometry via `ViewStrategyDescriptor.connectors` and optional `getConnectors(personHeight)`.
- `FamilyTree` passes descriptor connectors into `ChartViewport`/`ChartContent`.
- `ChartContent` renders `ConnectorLines` + `SpouseJoinLines` only for tree strategies.
- Fan uses `FanChartContent` and bypasses tree connector rendering.
- Fan descriptor currently provides no-op connector helpers; functionally this is equivalent to `none`.

Target abstraction:

```ts
type ConnectorMode = "tree" | "none";

type ConnectorRegistration = {
  mode: ConnectorMode;
  resolveHelpers: (ctx: { personHeight: number }) => ConnectorHelpers | null;
  ConnectorLinesComponent?: React.ComponentType<ConnectorLinesProps>;
  SpouseJoinLinesComponent?: React.ComponentType<SpouseJoinLinesProps>;
};
```

Registry policy by strategy:

- `descendancy`: `mode = "tree"`
- `pedigree`: `mode = "tree"`
- `vertical_pedigree`: `mode = "tree"`
- `fan_chart`: `mode = "none"` (explicitly null connector surface)

Implementation notes:

- Keep connector geometry ownership in engine descriptors (`connectors` / `getConnectors`).
- App-level registry decides **whether** connector components are rendered.
- For fan, connector registration is explicit `none` (or `null`) rather than implicit fallback/no-op.
- This can coexist with `TreeNodeViewFactory` during migration; do not force fan through tree connector components.

### Proposed folder structure (target)

```text
src/components/TreeViewer/v2/
  chartStrategy/
    chartStrategyMeta.ts                # Registry row per ChartViewStrategyName
    chartStrategyGuards.ts              # isAncestorChartStrategy, etc. (thin helpers)
    connectorRegistry.ts                # strategy -> connector mode + resolver
    connectorFactory.ts                 # resolve connector helpers/components for ChartContent
    index.ts

  personDisplay/
    types.ts                            # PersonDisplay, PersonDisplayData, layout/action contracts
    variants.ts                         # strategy-scoped PersonDisplayVariantId

    registry/
      viewStrategyRegistry.ts           # strategy -> family, variant policy, adapters
      index.ts

    factories/
      personDisplayFactory.ts           # composition root
      personDisplayVariantFactory.ts
      personDisplayDataFactory.ts
      personDisplayLayoutFactory.ts
      personDisplayActionsFactory.ts
      personDisplayRendererFactory.ts
      index.ts

    renderers/
      tree/
        treePersonDisplayRenderer.tsx   # PersonNode family renderer surface
      fan/
        fanPersonDisplayRenderer.tsx    # PersonCell family renderer surface

    adapters/
      tree/
        treeLayoutAdapter.ts            # maps tree geometry -> PersonDisplayLayout
        treeActionsAdapter.ts           # maps existing card actions -> PersonDisplay actions
      fan/
        fanLayoutAdapter.ts             # maps fan geometry -> PersonDisplayLayout
        fanActionsAdapter.ts            # fan-cell action policy

    index.ts
```

### Ownership and migration notes

- `chartStrategy/*` owns cross-cutting strategy metadata used by `FamilyTree`, fetch, action routing, and display resolution.
- `chartStrategy/*` also owns connector-mode policy (`tree` vs `none`), while geometry stays in engine descriptors.
- `personDisplay/*` owns chart-surface person display contracts only (not overlays/peek/more-menu UIs).
- Existing modules are migrated incrementally:
  - `lib/person-card-layout.ts` remains the source for current tree layout semantics while `personDisplayVariantFactory` wraps policy.
  - `v2/ChartContent.tsx` becomes a thin orchestration layer that consumes `personDisplayFactory` outputs.
  - `v2/fan/FanChartContent.tsx` remains the fan rendering implementation, then gradually delegates shared concerns to `personDisplay`.
  - `v2/hooks/useFamilyTreeActions.ts` and pedigree handlers are wrapped by `personDisplayActionsFactory` first, then slimmed.

Keep old entry points as temporary wrappers during migration to minimize churn and preserve behavior.

### What this does not imply

- It does **not** force fan through `TreeNodeViewFactory`, `TreeNodes`, or tree connector pipelines.
- It does **not** classify fan peek / detail overlays as `PersonDisplay` variants.

### General-purpose chart renderer direction (without fan regressions)

We can support all strategies with one higher-level rendering framework as long as the design is
**capability-based**, not "force every strategy through tree nodes/connectors."

Proposed shape:

- Shared chart-surface contract:
  - `renderPeople(...)`
  - `renderRelationships(...)` (may be `none`)
  - `renderInteractionOverlays(...)` (optional)
- Per-strategy renderer adapters:
  - tree adapter (descendancy, pedigree, vertical pedigree)
  - fan adapter (sector/cell rendering and fan-specific interactions)
- Strategy capabilities in registry:
  - e.g. `relationshipMode: "explicit" | "implicit" | "none"`
  - plus feature flags such as spouse joins, ancestor collapse support, etc.
- Shared person/action contracts with strategy-specific layout payloads:
  - common action/data inputs
  - cartesian tree layout vs polar fan layout as separate typed payloads

Non-negotiable constraint:

- Fan keeps its implicit relationship presentation and polar rendering model.
- Tree strategies keep explicit connector semantics.
- No fake connector requirement for fan.

---

## Suggested execution order

1. **§2 (registry)** in a small PR first: low churn, high clarity for the next steps.  
2. **§3 (factory / context)** in a tiny PR: depends on naming from §2 (`treeNodeViewStrategyKey` may subsume §3).  
3. **§1 (FamilyTree decomposition)** in a series of PRs, using §2 helpers as you touch each block.
4. **§4 (PersonDisplay architecture)** after §2 starts: introduce registry/factory skeleton with no UI behavior change, then migrate call sites incrementally.

Alternative: **§1 first** if `FamilyTree` is actively blocking other work—then §2 while touching branches, then §3 last.

---

## Out of scope

- **§1–§3 track:** Moving business logic from app to `gedcom-go` / engine (follow existing thin-shell rules separately); rewriting fan to use `TreeNodes`; changing history or reducer semantics unless required by a bugfix.
- **§4 track:** Forcing fan through the **tree** connector / `TreeNodeViewFactory` pipeline (remains out of scope; see §3). Unifying fan and tree into **one** React component tree without separate surface implementations.

---

## Verification checklist

**After §1–§3**

- [ ] Descendancy: spouses, collapse subtree, pan, depth.
- [ ] Pedigree + vertical: FAMC picker, choose parent family, collapse ancestors, depth expand, home centering.
- [ ] Fan: render, peek modal, make root, choose parent family when multi-FAMC.
- [ ] URL: `chart=`, `famc=`, `depth=` where applicable.
- [ ] `npx tsc --noEmit` in `the-gonsalves-family`.

**After §4 (when attempted)**

- [ ] Tree modes: card actions, compact card if applicable, name/date/photo consistency with prior behavior.
- [ ] Fan: sector labels, avatars if any, peek / actions unchanged.
