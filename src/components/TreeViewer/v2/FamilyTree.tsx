"use client";

import { useRef, useEffect, useCallback, useState } from "react";
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
  isChartViewStrategyName,
} from "@/genealogy-visualization-engine";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { useTreeIndividuals } from "@/hooks/useTreeData";
import type { ChartMenuRootActionDeps } from "./ChartHeader";
import { TreeNodeViewProvider } from "@/providers/TreeNodeViewContext";
import { dispatchRefreshViewport } from "./utils/viewportRefresh";
import { FamilyTreeLoading } from "./FamilyTreeLoading";
import { FamilyTreeHeader } from "./FamilyTreeHeader";
import { FamilyTreeOverlays } from "./FamilyTreeOverlays";
import { PersonDetailOverlay, type PersonDetailOverlayPerson } from "./PersonDetailOverlay";
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
  } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [chartTypeModalOpen, setChartTypeModalOpen] = useState(false);
  const [personDetailOverlay, setPersonDetailOverlay] = useState<PersonDetailOverlayPerson | null>(null);

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
  } = treeState;

  const { rootId } = state;
  const chartStrategy: ChartViewStrategyName = isChartViewStrategyName(state.strategyName)
    ? state.strategyName
    : "descendancy";
  const effectiveRootId = rootId;
  const effectiveFetchDepth = Math.max(
    viewState.currentDepth ?? DEFAULT_MAX_DEPTH,
    viewState.displayDepth ?? 0
  );
  const chartFetchDepth =
    chartStrategy === "pedigree" || chartStrategy === "vertical_pedigree"
      ? Math.min(Math.max(effectiveFetchDepth, 1), DEFAULT_PEDIGREE_DEPTH)
      : effectiveFetchDepth;
  const siblingViewPersonId = viewState.siblingView?.personId;
  const onSiblingViewMeta = useCallback(
    (siblingView: {
      personId: string;
      spouseCatchAlls: string[];
      adoptiveUnions: string[];
      adoptiveCatchAlls: string[];
    }) => {
      dispatch({ type: "SET_SIBLING_VIEW_FROM_API", siblingView });
    },
    [dispatch]
  );

  const { isChartLoading, chartDataKey, chartAdapter } = useChartViewFetch(
    chartStrategy,
    rootId,
    chartFetchDepth,
    siblingViewPersonId,
    onSiblingViewMeta
  );

  const search = useChartSearch({ useTreeIndividuals });
  const effectiveBuildDepthRaw =
    viewState.currentDepth ?? viewState.displayDepth ?? DEFAULT_MAX_DEPTH;
  const effectiveBuildDepth =
    chartStrategy === "pedigree" || chartStrategy === "vertical_pedigree"
      ? Math.min(effectiveBuildDepthRaw, DEFAULT_PEDIGREE_DEPTH)
      : effectiveBuildDepthRaw;
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

  const panZoom = usePanZoom({ svgRef, bounds, baseX, baseY });
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

  const { centerOnPerson, scheduleCenterOnPerson } = usePanToPerson({
    root,
    centerOnPosition,
    bounds,
  });

  const boundsKey = bounds
    ? `${bounds.minX},${bounds.maxX},${bounds.maxY}`
    : "";
  const skipNextGoToInitialViewRef = useRef(false);
  const panToPersonId = viewState.panToPersonId;
  useEffect(() => {
    if (skipNextGoToInitialViewRef.current) {
      skipNextGoToInitialViewRef.current = false;
      return;
    }
    if (panToPersonId) return;
    goToInitialView();
  }, [effectiveRootId, viewState, goToInitialView, boundsKey, panToPersonId]);
  useEffect(() => {
    if (!panToPersonId || !bounds) return;
    centerOnPerson(panToPersonId);
    // boundsKey (not bounds) to avoid re-run on every bounds object reference change
  // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on boundsKey for layout readiness
  }, [panToPersonId, boundsKey, centerOnPerson]);

  const panToPartnerModal = usePanToPartnerModal({ dispatch });

  const handleChartStrategyChange = useCallback((next: ChartViewStrategyName) => {
    dispatch({ type: "SET_VIEW_STRATEGY", strategyName: next });
  }, [dispatch]);

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
    effectiveCurrentDepth,
    settings.personCardLayout,
    descendantsPartnersAllOpen,
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
    goToInitialView,
    setToast,
    setRootDisplayNames,
    scheduleCenterOnPerson,
    effectiveRootId,
    triggerBlinkBack: treeState.triggerBlinkBack,
    skipNextGoToInitialViewRef,
    openPanToPartnerModal: panToPartnerModal.openPanToPartnerModal,
  });

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
          overlayOpen={goToPersonDrawerOpen}
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
              onNameClick={(person: PersonDetailOverlayPerson) => setPersonDetailOverlay(person)}
              settings={settings}
              viewState={viewState}
              chartStrategy={chartStrategy}
              connectors={
                (() => {
                  const d = chartAdapter.getDescriptor();
                  return d.getConnectors?.(effectivePersonHeight) ?? d.connectors;
                })()
              }
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
              bounds={bounds}
              setPan={setPan}
              isMobile={isMobile}
              hasSiblingView={!!viewState.siblingView}
              showLegendPanel={panels.showLegendPanel}
              onToggleLegendPanel={() => panels.setShowLegendPanel((p) => !p)}
              showDebugPanel={panels.showDebugPanel}
              onToggleDebugPanel={() => panels.setShowDebugPanel((p) => !p)}
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
