"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  DEFAULT_MAX_DEPTH,
  isAllSpousesRevealed,
  useDescendancyFetch,
  useChartSearch,
  useDepth,
  usePanZoom,
  usePanToPerson,
  useTreeBuild,
} from "@/genealogy-visualization-engine";
import type { ChartMenuRootActionDeps } from "./ChartHeader";
import { TreeNodeViewProvider } from "@/providers/TreeNodeViewContext";
import { dispatchRefreshViewport } from "./utils/viewportRefresh";
import { FamilyTreeLoading } from "./FamilyTreeLoading";
import { FamilyTreeHeader } from "./FamilyTreeHeader";
import { FamilyTreeOverlays } from "./FamilyTreeOverlays";
import { PersonDetailOverlay, type PersonDetailOverlayPerson } from "./PersonDetailOverlay";
import { ChartViewport } from "./ChartViewport/ChartViewport";
import { useFamilyTreeState } from "./hooks/useFamilyTreeState";
import { useFamilyTreeActions } from "./hooks/useFamilyTreeActions";
import { usePanToPartnerModal } from "./hooks/usePanToPartnerModal";
import { useHistoryHandlers } from "./hooks/useHistoryHandlers";
import { useTreePeople } from "./hooks/useTreePeople";
import { useRootDisplayName } from "./hooks/useRootDisplayName";
import { getEffectivePersonHeight } from "@/lib/personNodeHeight";

export interface FamilyTreeProps {
  /** When set, tree loads with this person as root (e.g. /tree/viewer?root=@I123@). */
  initialRootId?: string | null;
  /** When true and initialRootId is set, restore history from localStorage and append "Make root, rootName". */
  loadSavedHistory?: boolean;
  /** Display name for the new root when loadSavedHistory is true (used in history entry label). */
  rootName?: string | null;
}

const TUTORIAL_SEEN_KEY = "treeViewerTutorialSeenV2";

export function FamilyTree(props: FamilyTreeProps = {}) {
  const { initialRootId = null, loadSavedHistory = false, rootName = null } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
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

  const treeState = useFamilyTreeState({ initialRootId, loadSavedHistory, rootName });
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
  const effectiveRootId = rootId;
  const effectiveFetchDepth = Math.max(
    viewState.currentDepth ?? DEFAULT_MAX_DEPTH,
    viewState.displayDepth ?? 0
  );
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

  const { isDescendancyLoading, descendancyDataKey, builder } = useDescendancyFetch(
    rootId,
    effectiveFetchDepth,
    siblingViewPersonId,
    onSiblingViewMeta
  );

  const search = useChartSearch();
  const effectiveBuildDepth =
    viewState.currentDepth ?? viewState.displayDepth ?? DEFAULT_MAX_DEPTH;
  const effectivePersonHeight = getEffectivePersonHeight(settings);
  const { root, baseX, baseY, bounds, maxDepthRendered } = useTreeBuild({
    effectiveRootId,
    viewState,
    maxDepth: effectiveBuildDepth,
    descendancyDataKey,
    builder,
    effectivePersonHeight,
  });

  const depth = useDepth({
    dispatch,
    viewState,
    maxDepthRendered,
    builder,
  });
  const {
    effectiveMaxDepth,
    handleMaxDepthChange,
    currentDepthRendered,
    atMaxDepth,
    displayedDepth,
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

  const onPan = useCallback((dx: number, dy: number) => {
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, [setPan]);

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

  const actions = useFamilyTreeActions({
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
    descendancyDataKey
  );

  const strategyName = builder?.currentStrategyName ?? "descendancy";

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
    <TreeNodeViewProvider strategyName={strategyName}>
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
          onToggleAllSpouses={() => {
            dispatch({
              type: isAllSpousesRevealed(viewState.revealedUnions)
                ? "CLOSE_ALL_SPOUSES"
                : "REVEAL_ALL_SPOUSES",
            });
          }}
        />

        {builder == null ? (
          <FamilyTreeLoading isLoading={isDescendancyLoading} />
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
              isLoading={isDescendancyLoading}
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
              connectors={
                (() => {
                  const strategy = builder.getCurrentStrategy();
                  return strategy?.getConnectors?.(effectivePersonHeight) ?? strategy?.connectors;
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
              onPan={onPan}
              onGoToPerson={() => setGoToPersonDrawerOpen(true)}
              onToggleAllSpouses={() => {
                dispatch({
                  type: isAllSpousesRevealed(viewState.revealedUnions)
                    ? "CLOSE_ALL_SPOUSES"
                    : "REVEAL_ALL_SPOUSES",
                });
              }}
              bounds={bounds}
              setPan={setPan}
              isMobile={isMobile}
              hasSiblingView={!!viewState.siblingView}
              showLegendPanel={panels.showLegendPanel}
              onToggleLegendPanel={() => panels.setShowLegendPanel((p) => !p)}
              showDebugPanel={panels.showDebugPanel}
              onToggleDebugPanel={() => panels.setShowDebugPanel((p) => !p)}
              onOpenTutorial={() => setShowTutorialModal(true)}
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
          strategyName={builder?.currentStrategyName ?? "descendancy"}
        />
        {personDetailOverlay && (
          <PersonDetailOverlay
            person={personDetailOverlay}
            onClose={() => setPersonDetailOverlay(null)}
            isMobile={isMobile}
          />
        )}
      </div>
    </TreeNodeViewProvider>
  );
}
