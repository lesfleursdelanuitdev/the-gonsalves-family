"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import {
  DEFAULT_MAX_DEPTH,
  DEFAULT_PEDIGREE_DEPTH,
  isAllSpousesRevealed,
  useChartSearch,
  useChartViewFetch,
  useDepth,
  usePanZoom,
  usePanToPerson,
  useTreeBuild,
} from "@/genealogy-visualization-engine";
import type { ChartViewStrategyName, PersonCardAction, SiblingView } from "@/genealogy-visualization-engine";
import { useTreeIndividuals } from "@/hooks/useTreeData";
import type { ChartMenuRootActionDeps } from "./ChartHeader";
import { TreeNodeViewProvider } from "@/providers/TreeNodeViewContext";
import { dispatchRefreshViewport } from "./utils/viewportRefresh";
import { FamilyTreeLoading } from "./FamilyTreeLoading";
import { FamilyTreeHeader } from "./FamilyTreeHeader";
import { FamilyTreeOverlays } from "./FamilyTreeOverlays";
import { PersonDetailOverlay, type PersonDetailOverlayPerson } from "./PersonDetailOverlay";
import type { FamiliesAsChildResponse } from "./PersonDetailOverlay/types";
import { PedigreeFamcPickerModal } from "./ChartHeader/ChartMenu/PedigreeFamcPickerModal";
import { FanPersonPeekModal } from "./fan/FanPersonPeekModal";
import type { FanMoreClickPayload } from "./fan/fanPeekTypes";
import { normalizeGedcomXref } from "./PersonDetailOverlay/utils";
import { ChartViewport } from "./ChartViewport/ChartViewport";
import { useFamilyTreeState } from "./hooks/useFamilyTreeState";
import { useFamilyTreeActions } from "./hooks/useFamilyTreeActions";
import { usePanToPartnerModal } from "./hooks/usePanToPartnerModal";
import { useHistoryHandlers } from "./hooks/useHistoryHandlers";
import { useTreePeople } from "./hooks/useTreePeople";
import { useRootDisplayName } from "./hooks/useRootDisplayName";
import { getEffectivePersonHeight } from "@/lib/personNodeHeight";
import type { PersonCardLayout } from "@/lib/person-card-layout";
import type { TreeViewerPartnersUrl } from "@/lib/treeViewerUrl";
import {
  buildTreeViewerSearchParams,
  treeViewerSearchParamsEqual,
} from "@/lib/treeViewerUrl";
import { resolveDefaultRootPedigreeFamc } from "@/lib/pedigreeDefaultFamc";
import {
  isAncestorChartStrategy,
  isDescendancyStrategy,
  isFanChartStrategy,
  isPedigreeTreeStrategy,
  resolveConnectorsForStrategy,
  resolveChartStrategyName,
  usesPedigreeFamcStrategy,
} from "./chartStrategy";

export interface FamilyTreeProps {
  /** When set, tree loads with this person as root (e.g. /tree/viewer?root=@I123@). */
  initialRootId?: string | null;
  /** When true and initialRootId is set, restore history from localStorage and append "Make root, rootName". */
  loadSavedHistory?: boolean;
  /** Display name for the new root when loadSavedHistory is true (used in history entry label). */
  rootName?: string | null;
  /** Initial chart mode from URL (`chart=pedigree` | `chart=descendancy`). */
  initialChartStrategy?: ChartViewStrategyName | null;
  /** From `depth` query (see `lib/treeViewerUrl.ts`). */
  initialUrlDepth?: number | null;
  /** From `card` query. */
  initialPersonCardLayout?: PersonCardLayout | null;
  /** From `partners` query (`open` | `closed`); `null` = do not apply from URL. */
  initialPartnersUrl?: TreeViewerPartnersUrl | null;
  /** From `famc` query — pedigree family xref when opening in pedigree / vertical pedigree. */
  initialPedigreeFamcFamilyXref?: string | null;
}

const TUTORIAL_SEEN_KEY = "treeViewerTutorialSeenV2";

export function FamilyTree(props: FamilyTreeProps = {}) {
  const {
    initialRootId = null,
    loadSavedHistory = false,
    rootName = null,
    initialChartStrategy = null,
    initialUrlDepth = null,
    initialPersonCardLayout = null,
    initialPartnersUrl = null,
    initialPedigreeFamcFamilyXref = null,
  } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [chartTypeModalOpen, setChartTypeModalOpen] = useState(false);
  const [personDetailOverlay, setPersonDetailOverlay] = useState<PersonDetailOverlayPerson | null>(null);
  const [fanPeek, setFanPeek] = useState<FanMoreClickPayload | null>(null);
  const [pedigreeFamcPicker, setPedigreeFamcPicker] = useState<null | {
    strategyName: "pedigree" | "vertical_pedigree" | "fan_chart";
    families: FamiliesAsChildResponse["familiesOfOrigin"];
    /** When set, choosing a family re-roots or sets FAMC for this person (not only chart entry). */
    forPersonId?: string | null;
  }>(null);

  const familiesAsChildCacheRef = useRef<Map<string, FamiliesAsChildResponse>>(new Map());
  const familiesAsChildInflightRef = useRef<Map<string, Promise<FamiliesAsChildResponse | null>>>(
    new Map()
  );

  const loadFamiliesAsChild = useCallback(async (xref: string): Promise<FamiliesAsChildResponse | null> => {
    const key = normalizeGedcomXref(xref);
    if (!key) return null;
    const hit = familiesAsChildCacheRef.current.get(key);
    if (hit) return hit;
    let pending = familiesAsChildInflightRef.current.get(key);
    if (!pending) {
      pending = (async () => {
        try {
          const res = await fetch(`/api/tree/individuals/${encodeURIComponent(key)}/detail/families-as-child`);
          if (!res.ok) return null;
          const json = (await res.json()) as FamiliesAsChildResponse;
          familiesAsChildCacheRef.current.set(key, json);
          return json;
        } catch {
          return null;
        } finally {
          familiesAsChildInflightRef.current.delete(key);
        }
      })();
      familiesAsChildInflightRef.current.set(key, pending);
    }
    return pending;
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !window.localStorage.getItem(TUTORIAL_SEEN_KEY)) {
        setShowTutorialModal(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleCloseTutorial = useCallback(() => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
    } catch {
      // ignore
    }
    setShowTutorialModal(false);
  }, []);

  const treeState = useFamilyTreeState({
    initialRootId,
    loadSavedHistory,
    rootName,
    initialChartStrategy,
    initialUrlDepth,
    initialPersonCardLayout,
    initialPedigreeFamcFamilyXref,
  });
  const {
    state,
    dispatch,
    viewState,
    settings,
    updateSetting,
    toast,
    setToast,
    headerOpen,
    setHeaderOpen,
    isMobile,
    rootDisplayNames,
    setRootDisplayNames,
    goToPersonDrawerOpen,
    setGoToPersonDrawerOpen,
    panels,
    spouseDrawer,
    triggerBlinkBack,
  } = treeState;

  const { rootId } = state;
  const chartStrategy: ChartViewStrategyName = resolveChartStrategyName(state.strategyName);
  const isAncestorChart = isAncestorChartStrategy(chartStrategy);
  const pedigreeFamcFromState =
    usesPedigreeFamcStrategy(chartStrategy)
      ? (viewState.pedigreeFamcFamilyXref ?? null)
      : null;
  const effectiveRootId = rootId;

  /** Non-root FAMC overrides only — root uses `pedigreeFamcFromState` (`famc=` query param). */
  const pedigreeFamcOverridesForFetch = useMemo(() => {
    if (!isAncestorChart) return null;
    const raw = viewState.pedigreeFamcOverrides;
    if (!raw || Object.keys(raw).length === 0) return null;
    const rootNorm = normalizeGedcomXref(effectiveRootId);
    const next: Record<string, string> = { ...raw };
    for (const k of Object.keys(next)) {
      if (normalizeGedcomXref(k) === rootNorm) delete next[k];
    }
    return Object.keys(next).length > 0 ? next : null;
  }, [isAncestorChart, viewState.pedigreeFamcOverrides, effectiveRootId]);
  const effectiveFetchDepth = Math.max(
    viewState.currentDepth ?? DEFAULT_MAX_DEPTH,
    viewState.displayDepth ?? 0
  );
  const chartFetchDepth =
    isAncestorChart
      ? Math.min(Math.max(effectiveFetchDepth, 1), DEFAULT_PEDIGREE_DEPTH)
      : effectiveFetchDepth;
  const siblingViewPersonId = viewState.siblingView?.personId;
  const onSiblingViewMeta = useCallback(
    (siblingView: SiblingView) => {
      dispatch({ type: "SET_SIBLING_VIEW_FROM_API", siblingView });
    },
    [dispatch]
  );

  const { isChartLoading, chartDataKey, chartAdapter, pedigreeMultiFamilyChildXrefs } =
    useChartViewFetch(
      chartStrategy,
      rootId,
      chartFetchDepth,
      siblingViewPersonId,
      onSiblingViewMeta,
      pedigreeFamcFromState,
      pedigreeFamcOverridesForFetch
    );

  /** Warm cache so "Choose parent family" opens instantly for multi-family nodes on the pedigree. */
  useEffect(() => {
    if (!isAncestorChart) return;
    for (const xref of pedigreeMultiFamilyChildXrefs ?? []) {
      void loadFamiliesAsChild(xref);
    }
  }, [isAncestorChart, pedigreeMultiFamilyChildXrefs, loadFamiliesAsChild]);

  const search = useChartSearch({ useTreeIndividuals });
  const effectiveBuildDepthRaw =
    viewState.currentDepth ?? viewState.displayDepth ?? DEFAULT_MAX_DEPTH;
  const effectiveBuildDepth =
    isAncestorChart
      ? Math.min(effectiveBuildDepthRaw, DEFAULT_PEDIGREE_DEPTH)
      : effectiveBuildDepthRaw;
  const pedigreeHasRoomToExpandDepth =
    isAncestorChart &&
    effectiveBuildDepth < DEFAULT_PEDIGREE_DEPTH;
  const effectivePersonHeight = getEffectivePersonHeight(settings, {
    chartStrategy,
    isMobile,
  });
  const { root, baseX, baseY, bounds, maxDepthRendered } = useTreeBuild({
    effectiveRootId,
    viewState,
    maxDepth: effectiveBuildDepth,
    chartDataKey,
    chartAdapter,
    effectivePersonHeight,
    parentPairGap: settings.parentPairGap,
  });

  const depth = useDepth({
    dispatch,
    viewState,
    maxDepthRendered,
    builder: chartAdapter?.getDataBuilder() ?? null,
  });
  const {
    effectiveMaxDepth,
    handleMaxDepthChange,
    currentDepthRendered,
    atMaxDepth,
    displayedDepth,
    effectiveCurrentDepth,
  } = depth;

  const deferLayoutOriginInitialPan = isPedigreeTreeStrategy(chartStrategy);
  const panZoom = usePanZoom({
    svgRef,
    bounds,
    baseX,
    baseY,
    deferLayoutOriginInitialPan,
  });
  const {
    pan,
    setPan,
    scale,
    zoomIn,
    zoomOut,
    fitToScreen,
    goToInitialView,
    centerOnPosition,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    dragging,
  } = panZoom;

  useEffect(() => {
    if (!isFanChartStrategy(chartStrategy)) setFanPeek(null);
  }, [chartStrategy]);

  const { centerOnPerson, scheduleCenterOnPerson } = usePanToPerson({
    root,
    centerOnPosition,
    bounds,
  });

  /** Descendancy: layout-origin framing. Pedigree / vertical pedigree: center on proband. */
  const handleChartHomeView = useCallback(() => {
    if (isPedigreeTreeStrategy(chartStrategy)) {
      centerOnPerson(effectiveRootId);
      return;
    }
    goToInitialView();
  }, [chartStrategy, centerOnPerson, effectiveRootId, goToInitialView]);

  const boundsKey = bounds
    ? `${bounds.minX},${bounds.maxX},${bounds.maxY}`
    : "";
  const skipNextGoToInitialViewRef = useRef(false);
  const panToPersonId = viewState.panToPersonId;

  // Descendancy (and other non-pedigree): frame layout origin like root at (0,0) after base transform.
  useEffect(() => {
    if (isPedigreeTreeStrategy(chartStrategy)) return;
    if (skipNextGoToInitialViewRef.current) {
      skipNextGoToInitialViewRef.current = false;
      return;
    }
    if (panToPersonId) return;
    goToInitialView();
  }, [effectiveRootId, viewState, goToInitialView, boundsKey, panToPersonId, chartStrategy]);

  // Horizontal / vertical pedigree: center viewport on the proband using laid-out node coordinates.
  useEffect(() => {
    if (!isPedigreeTreeStrategy(chartStrategy)) return;
    if (panToPersonId) return;
    if (!bounds) return;
    scheduleCenterOnPerson(effectiveRootId);
  }, [chartStrategy, boundsKey, effectiveRootId, panToPersonId, bounds, scheduleCenterOnPerson]);
  useEffect(() => {
    if (!panToPersonId || !bounds) return;
    centerOnPerson(panToPersonId);
    // boundsKey (not bounds) to avoid re-run on every bounds object reference change
  // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on boundsKey for layout readiness
  }, [panToPersonId, boundsKey, centerOnPerson]);

  const panToPartnerModal = usePanToPartnerModal({ dispatch });

  const handleChartStrategyChange = useCallback(
    async (next: ChartViewStrategyName) => {
      if (next === "descendancy") {
        dispatch({ type: "SET_VIEW_STRATEGY", strategyName: next });
        return;
      }
      if (!isAncestorChartStrategy(next)) {
        dispatch({ type: "SET_VIEW_STRATEGY", strategyName: next });
        return;
      }

      const existingFamcRaw = viewState.pedigreeFamcFamilyXref ?? "";
      const existingFamcNorm = existingFamcRaw.trim()
        ? normalizeGedcomXref(existingFamcRaw)
        : "";
      const fromPed = isAncestorChartStrategy(chartStrategy);

      const famcMatchesFamilyList = (
        families: FamiliesAsChildResponse["familiesOfOrigin"]
      ): boolean =>
        Boolean(
          existingFamcNorm &&
            families.some((f) => normalizeGedcomXref(f.family.xref) === existingFamcNorm)
        );

      const json = await loadFamiliesAsChild(rootId);
      const families = json?.familiesOfOrigin ?? [];

      /** Horizontal ↔ vertical pedigree: keep current FAMC when still valid */
      if (fromPed && existingFamcNorm) {
        if (families.length === 0) {
          dispatch({
            type: "SET_VIEW_STRATEGY",
            strategyName: next,
            pedigreeFamcFamilyXref: existingFamcNorm,
          });
          return;
        }
        if (families.length === 1) {
          const only = normalizeGedcomXref(families[0].family.xref);
          dispatch({
            type: "SET_VIEW_STRATEGY",
            strategyName: next,
            pedigreeFamcFamilyXref: only || existingFamcNorm,
          });
          return;
        }
        if (famcMatchesFamilyList(families)) {
          dispatch({
            type: "SET_VIEW_STRATEGY",
            strategyName: next,
            pedigreeFamcFamilyXref: existingFamcNorm,
          });
          return;
        }
        dispatch({
          type: "SET_VIEW_STRATEGY",
          strategyName: next,
          pedigreeFamcFamilyXref: existingFamcNorm,
        });
        return;
      }

      /** Descendancy (or fresh) → pedigree: always switch immediately; default to birth lineage */
      if (!json) {
        dispatch({ type: "SET_VIEW_STRATEGY", strategyName: next });
        return;
      }

      let defaultFamc: string | null = null;
      if (families.length === 1 && families[0].family.xref?.trim()) {
        defaultFamc = normalizeGedcomXref(families[0].family.xref);
      } else if (families.length > 1) {
        defaultFamc = resolveDefaultRootPedigreeFamc(families);
      }

      dispatch({
        type: "SET_VIEW_STRATEGY",
        strategyName: next,
        pedigreeFamcFamilyXref: defaultFamc,
      });
    },
    [chartStrategy, dispatch, rootId, viewState.pedigreeFamcFamilyXref, loadFamiliesAsChild]
  );

  useEffect(() => {
    setPedigreeFamcPicker(null);
  }, [rootId]);

  useEffect(() => {
    familiesAsChildCacheRef.current.clear();
    familiesAsChildInflightRef.current.clear();
  }, [rootId]);

  const appliedUrlPartnersRef = useRef(false);
  useEffect(() => {
    appliedUrlPartnersRef.current = false;
  }, [initialPartnersUrl]);

  useEffect(() => {
    if (initialPartnersUrl == null) return;
    if (chartStrategy !== "descendancy") return;
    if (!chartAdapter || isChartLoading) return;
    if (appliedUrlPartnersRef.current) return;
    appliedUrlPartnersRef.current = true;
    dispatch({
      type: initialPartnersUrl === "open" ? "REVEAL_ALL_SPOUSES" : "CLOSE_ALL_SPOUSES",
    });
  }, [initialPartnersUrl, chartStrategy, chartAdapter, isChartLoading, dispatch]);

  const descendantsPartnersAllOpen =
    chartStrategy === "descendancy" && isAllSpousesRevealed(viewState.revealedUnions);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const partnersUrl: TreeViewerPartnersUrl | null =
      chartStrategy === "descendancy"
        ? descendantsPartnersAllOpen
          ? "open"
          : "closed"
        : null;
    const existing = new URLSearchParams(window.location.search);
    const next = buildTreeViewerSearchParams(
      {
        rootId,
        chartStrategy,
        depth: effectiveCurrentDepth,
        personCardLayout: settings.personCardLayout,
        partnersUrl,
        pedigreeFamcFamilyXref:
          isAncestorChart
            ? (viewState.pedigreeFamcFamilyXref ?? null)
            : null,
      },
      existing
    );
    if (treeViewerSearchParamsEqual(existing, next)) return;
    const u = new URL(window.location.href);
    u.search = next.toString() ? `?${next.toString()}` : "";
    window.history.replaceState(null, "", `${u.pathname}${u.search}${u.hash}`);
  }, [
    rootId,
    chartStrategy,
    isAncestorChart,
    effectiveCurrentDepth,
    settings.personCardLayout,
    descendantsPartnersAllOpen,
    viewState.pedigreeFamcFamilyXref,
  ]);

  const actions = useFamilyTreeActions({
    chartStrategyName: chartStrategy,
    dispatch,
    viewState,
    settings,
    panels,
    search,
    spouseDrawer,
    currentDepthRendered,
    atMaxDepth,
    effectiveMaxDepth,
    handleMaxDepthChange,
    displayedDepth,
    setPan,
    goToInitialView: handleChartHomeView,
    setToast,
    setRootDisplayNames,
    scheduleCenterOnPerson,
    effectiveRootId,
    triggerBlinkBack: treeState.triggerBlinkBack,
    skipNextGoToInitialViewRef,
    openPanToPartnerModal: panToPartnerModal.openPanToPartnerModal,
    setPedigreeFamcPicker,
    loadFamiliesAsChild,
  });

  const handleFanPeekViewProfile = useCallback(() => {
    if (!fanPeek) return;
    const p = fanPeek;
    setFanPeek(null);
    setPersonDetailOverlay({ name: p.name, xref: p.xref, uuid: p.uuid });
  }, [fanPeek]);

  const handleFanPeekMakeRoot = useCallback(() => {
    if (!fanPeek) return;
    const p = fanPeek;
    const name = p.name.trim();
    setRootDisplayNames((prev) => ({ ...prev, [p.personId]: name }));
    dispatch({ type: "ROOT", personId: p.personId });
    setPan({ x: 0, y: 0 });
    triggerBlinkBack();
    setFanPeek(null);
    dispatchRefreshViewport();
  }, [fanPeek, dispatch, setRootDisplayNames, setPan, triggerBlinkBack]);

  const handleFanPeekChooseParentFamily = useCallback(() => {
    if (!fanPeek?.hasMultipleFamiliesAsChild) return;
    const id = fanPeek.personId;
    setFanPeek(null);
    actions.onAction("pedigreeChooseParentFamily" as PersonCardAction, id);
  }, [fanPeek, actions]);

  const treePeople = useTreePeople(root);
  const rootDisplayName = useRootDisplayName(
    rootId,
    effectiveRootId,
    rootDisplayNames,
    setRootDisplayNames,
    chartDataKey
  );

  const historyHandlers = useHistoryHandlers({
    dispatch,
    closeDrawer: spouseDrawer.closeDrawer,
    setPan,
  });

  const handleSelectPerson = useCallback(
    (personId: string, layoutX?: number, layoutY?: number) => {
      if (layoutX != null && layoutY != null) {
        centerOnPosition(layoutX, layoutY);
      } else {
        centerOnPerson(personId);
      }
      setGoToPersonDrawerOpen(false);
      dispatchRefreshViewport();
    },
    [centerOnPosition, centerOnPerson, setGoToPersonDrawerOpen]
  );

  return (
    <TreeNodeViewProvider strategyName={chartStrategy}>
      <style>{`
        .tree-viewer-root {
          min-height: var(--app-height, 100svh);
        }
        @media (max-width: 640px) {
          .tree-viewer-root {
            height: var(--app-height, var(--mobile-viewport-height, 100dvh));
            max-height: var(--app-height, var(--mobile-viewport-height, 100dvh));
            min-height: var(--app-height, var(--mobile-viewport-height, 100dvh));
            width: 100%;
            max-width: var(--mobile-viewport-width, 100dvw);
            overflow: hidden;
            overflow-x: hidden;
          }
        }
      `}</style>
      <div
        className="tree-viewer-root font-body"
        style={{
          background: "var(--tree-bg)",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <FamilyTreeHeader
          headerOpen={headerOpen}
          onToggleHeader={() => setHeaderOpen((v) => !v)}
          overlayOpen={goToPersonDrawerOpen || (isMobile && panels.showHistoryPanel)}
          isMobile={isMobile}
          rootId={rootId}
          rootDisplayName={rootDisplayName}
          chartStrategy={chartStrategy}
          onChartStrategyChange={handleChartStrategyChange}
          chartTypeModalOpen={chartTypeModalOpen}
          onChartTypeModalOpenChange={setChartTypeModalOpen}
          onOpenTutorial={() => setShowTutorialModal(true)}
          viewState={viewState}
          showLegendPanel={panels.showLegendPanel}
          onToggleLegendPanel={() => panels.setShowLegendPanel((p) => !p)}
          searchGivenName={search.searchGivenName}
          searchLastName={search.searchLastName}
          onSearchGivenNameChange={search.setSearchGivenName}
          onSearchLastNameChange={search.setSearchLastName}
          searchResults={search.searchResults}
          searchLoading={search.searchLoading}
          selectedRootId={rootId}
          rootActionDeps={actions.rootActionDeps as ChartMenuRootActionDeps}
          setShowSearchPanel={actions.setShowSearchPanel}
          mobileSearchHref="/tree/viewer/searchDatabase"
          showHistoryPanel={panels.showHistoryPanel}
          onHistoryClick={panels.toggleHistoryPanel}
          history={state.history}
          historyIndex={state.historyIndex}
          onNavigateHistory={historyHandlers.onNavigateHistory}
          showInfo={panels.showInfo}
          onInfoClick={panels.toggleInfoPanel}
          showSettings={panels.showSettings}
          onSettingsClick={panels.toggleSettingsPanel}
          onGoToPerson={() => setGoToPersonDrawerOpen(true)}
          onToggleAllSpouses={
            chartStrategy === "descendancy"
              ? () => {
                  dispatch({
                    type: isAllSpousesRevealed(viewState.revealedUnions)
                      ? "CLOSE_ALL_SPOUSES"
                      : "REVEAL_ALL_SPOUSES",
                  });
                }
              : undefined
          }
        />

        {chartAdapter == null ? (
          <FamilyTreeLoading isLoading={isChartLoading} />
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              visibility:
                isMobile && panels.showSearchPanel ? "hidden" : "visible",
            }}
          >
            <ChartViewport
              isLoading={isChartLoading}
              svgRef={svgRef}
              baseX={baseX}
              baseY={baseY}
              pan={pan}
              scale={scale}
              root={root}
              rootId={effectiveRootId}
              onAction={actions.onAction}
              onNameClick={
                isFanChartStrategy(chartStrategy)
                  ? undefined
                  : (person: PersonDetailOverlayPerson) => setPersonDetailOverlay(person)
              }
              onFanMoreClick={isFanChartStrategy(chartStrategy) ? setFanPeek : undefined}
              settings={settings}
              viewState={viewState}
              chartStrategy={chartStrategy}
              connectors={resolveConnectorsForStrategy(
                chartStrategy,
                chartAdapter.getDescriptor(),
                effectivePersonHeight
              ) ?? undefined}
              dragging={dragging}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onWheel={onWheel}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onFitToScreen={fitToScreen}
              onGoToPerson={() => setGoToPersonDrawerOpen(true)}
              onToggleAllSpouses={
                isDescendancyStrategy(chartStrategy)
                  ? () => {
                      dispatch({
                        type: isAllSpousesRevealed(viewState.revealedUnions)
                          ? "CLOSE_ALL_SPOUSES"
                          : "REVEAL_ALL_SPOUSES",
                      });
                    }
                  : undefined
              }
              bounds={bounds}
              setPan={setPan}
              isMobile={isMobile}
              hasSiblingView={!!viewState.siblingView}
              showLegendPanel={panels.showLegendPanel}
              onToggleLegendPanel={() => panels.setShowLegendPanel((p) => !p)}
              showDebugPanel={panels.showDebugPanel}
              onToggleDebugPanel={() => panels.setShowDebugPanel((p) => !p)}
              pedigreeHasRoomToExpandDepth={pedigreeHasRoomToExpandDepth}
              pedigreeMultiFamilyChildXrefs={
                isAncestorChart
                  ? pedigreeMultiFamilyChildXrefs
                  : null
              }
            />
          </div>
        )}

        <FamilyTreeOverlays
          toast={toast}
          onDismissToast={() => setToast(null)}
          showDebugPanel={panels.showDebugPanel}
          onCloseDebugPanel={() => panels.setShowDebugPanel(false)}
          state={state}
          showHistoryPanel={panels.showHistoryPanel}
          onCloseHistoryPanel={() => panels.setShowHistoryPanel(false)}
          history={state.history}
          historyIndex={state.historyIndex}
          onNavigateHistory={historyHandlers.onNavigateHistory}
          onClearHistory={historyHandlers.onClearHistory}
          showInfo={panels.showInfo}
          onCloseInfo={() => panels.setShowInfo(false)}
          root={root}
          rootDisplayName={rootDisplayName}
          effectiveMaxDepth={effectiveMaxDepth}
          showSettings={panels.showSettings}
          onCloseSettings={() => panels.setShowSettings(false)}
          settings={settings}
          onUpdateSetting={updateSetting}
          displayedDepth={displayedDepth}
          onMaxDepthChange={handleMaxDepthChange}
          chartStrategy={chartStrategy}
          viewState={viewState}
          effectiveRootId={effectiveRootId}
          showLegendPanel={panels.showLegendPanel}
          onCloseLegendPanel={() => panels.setShowLegendPanel(false)}
          showLegendModal={panels.showLegendModal}
          onCloseLegendModal={() => panels.setShowLegendModal(false)}
          isMobile={isMobile}
          spouseDrawerPersonId={spouseDrawer.drawerPersonId}
          onSpouseDrawerSelect={actions.onDrawerSelect}
          onSpouseDrawerSelectAll={actions.onDrawerSelectAll}
          onSpouseDrawerCloseSpouse={actions.onCloseSpouse}
          onSpouseDrawerCloseAll={actions.onCloseAllSpouses}
          onCloseSpouseDrawer={() => {
            spouseDrawer.closeDrawer();
            dispatchRefreshViewport();
          }}
          goToPersonDrawerOpen={goToPersonDrawerOpen}
          onCloseGoToPersonDrawer={() => {
            setGoToPersonDrawerOpen(false);
            dispatchRefreshViewport();
          }}
          treePeople={treePeople}
          effectiveRootIdForDrawer={effectiveRootId}
          onSelectPerson={handleSelectPerson}
          showPanToPartnerModal={panToPartnerModal.showPanToPartnerModal}
          onConfirmPanToPartner={panToPartnerModal.onConfirmPanToPartner}
          onClosePanToPartnerModal={panToPartnerModal.onClosePanToPartnerModal}
          showTutorialModal={showTutorialModal}
          onCloseTutorial={handleCloseTutorial}
        />
        {pedigreeFamcPicker && (
          <PedigreeFamcPickerModal
            open
            pendingStrategy={pedigreeFamcPicker.strategyName}
            families={pedigreeFamcPicker.families}
            onClose={() => setPedigreeFamcPicker(null)}
            onSelectFamily={(familyXref) => {
              const norm = normalizeGedcomXref(familyXref);
              const pick = pedigreeFamcPicker;
              const target = pick?.forPersonId?.trim() || null;
              const rootNorm = normalizeGedcomXref(effectiveRootId);
              if (target && normalizeGedcomXref(target) !== rootNorm) {
                dispatch({
                  type: "PEDIGREE_SET_FAMC_FOR_PERSON",
                  personId: target,
                  familyXref: norm,
                });
              } else {
                dispatch({ type: "PEDIGREE_SET_FAMC_FAMILY_XREF", familyXref: norm });
              }
              setPedigreeFamcPicker(null);
            }}
            forPersonId={pedigreeFamcPicker.forPersonId ?? null}
          />
        )}
        {isFanChartStrategy(chartStrategy) && (
          <FanPersonPeekModal
            open={fanPeek != null}
            payload={fanPeek}
            isMobile={isMobile}
            isRoot={
              fanPeek != null &&
              normalizeGedcomXref(fanPeek.personId) === normalizeGedcomXref(effectiveRootId)
            }
            onClose={() => setFanPeek(null)}
            onViewProfile={handleFanPeekViewProfile}
            onMakeRoot={handleFanPeekMakeRoot}
            onChooseParentFamily={handleFanPeekChooseParentFamily}
          />
        )}
        {personDetailOverlay && (
          <PersonDetailOverlay
            key={normalizeGedcomXref(personDetailOverlay.xref) || personDetailOverlay.xref}
            person={personDetailOverlay}
            onClose={() => setPersonDetailOverlay(null)}
            onSelectLinkedPerson={(p) => {
              setPersonDetailOverlay((prev) => {
                if (prev != null && normalizeGedcomXref(prev.xref) === normalizeGedcomXref(p.xref)) {
                  return prev;
                }
                return p;
              });
            }}
            isMobile={isMobile}
          />
        )}
      </div>
    </TreeNodeViewProvider>
  );
}
