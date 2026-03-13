"use client";

import {
  collectAllPersonNodes,
  DEFAULT_MAX_DEPTH,
  DEFAULT_ROOT_XREF,
  getPeople,
  getAllActionTypes,
  isAllSpousesRevealed,
  treeReducer,
  createInitialState,
} from "@/descendancy-chart";
import { useMemo, useRef, useState, useEffect, useReducer, useCallback } from "react";
import { ChartHeader, ChartMenu } from "./ChartHeader";
import { ChartViewport } from "./ChartViewport";
import { ChartPanels } from "./ChartPanels";
import { DebugPanel } from "./ChartPanels/DebugPanel";
import { GoToPersonDrawer, SpouseDrawer, ToastMessage } from "./Misc";
import { TreeNodeViewProvider } from "./TreeNodeViewContext";
import {
  handlePersonCardAction,
  type HandlePersonCardActionContext,
  type PersonCardAction,
  type ViewState,
} from "@/descendancy-chart";
import {
  usePanZoom,
  useDescendancyFetch,
  useChartSearch,
  useDepth,
  usePanelVisibility,
  usePanToPerson,
  useSpouseDrawer,
  useTreeBuild,
} from "@/descendancy-chart";
import { dispatchRefreshViewport, TREE_VIEWER_VIEWPORT_RESIZED } from "./viewportRefresh";

interface FamilyTreeProps {
  /** When true, show debug panel (tree state). Reserved for future use. */
  debug?: boolean;
  /** When set, tree loads with this person as root (e.g. from /tree?root=@I123@). */
  initialRootId?: string | null;
}

/**
 * FamilyTree — descendancy chart with pan and wheel zoom.
 * Tree state (rootId, viewState, history) is managed by treeReducer.
 */
export function FamilyTree(_props: FamilyTreeProps = {}) {
  const { initialRootId = null } = _props;
  const svgRef = useRef<SVGSVGElement>(null);
  const initialState = useMemo(
    () => createInitialState("descendancy", initialRootId ?? undefined),
    [initialRootId]
  );
  const [state, dispatch] = useReducer(treeReducer, initialState);
  const { rootId, history, historyIndex } = state;
  const viewState = state.viewState as ViewState;
  const historyIndexRef = useRef(historyIndex);
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    console.log("[FamilyTree] available reducer actions:", getAllActionTypes());
  }, []);

  const spouseDrawer = useSpouseDrawer();
  const [toast, setToast] = useState<{ title: string; parts: { pedi: string; names: string }[] } | null>(null);
  const [blinkBack, setBlinkBack] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(true);

  const effectiveFetchDepthForFetch = Math.max(
    viewState.currentDepth ?? DEFAULT_MAX_DEPTH,
    viewState.displayDepth ?? 0
  );
  const siblingViewPersonId = viewState.siblingView?.personId;
  const onSiblingViewMeta = useCallback((siblingView: { personId: string; spouseCatchAlls: string[]; adoptiveUnions: string[]; adoptiveCatchAlls: string[] }) => {
    dispatch({ type: "SET_SIBLING_VIEW_FROM_API", siblingView });
  }, []);
  const { lastApiRootId, isDescendancyLoading, descendancyDataKey, builder } =
    useDescendancyFetch(rootId, effectiveFetchDepthForFetch, siblingViewPersonId, onSiblingViewMeta);

  const search = useChartSearch();
  const panels = usePanelVisibility();

  const [settings, setSettings] = useState({
    showDates: true,
    showPhotos: true,
    showUnknown: true,
    autoLegendModal: true,
    defaultRootId: DEFAULT_ROOT_XREF,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [rootDisplayNames, setRootDisplayNames] = useState<Record<string, string>>({});
  const [goToPersonDrawerOpen, setGoToPersonDrawerOpen] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const toastTimeoutRef = { current: 0 };
    const onViewportResized = (evt: Event) => {
      const title = (evt as CustomEvent<{ title: string }>).detail?.title ?? "Viewport resized";
      setToast({ title, parts: [] });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = window.setTimeout(() => setToast(null), 4000);
    };
    window.addEventListener(TREE_VIEWER_VIEWPORT_RESIZED, onViewportResized);
    return () => {
      window.removeEventListener(TREE_VIEWER_VIEWPORT_RESIZED, onViewportResized);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  function updateSetting<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function triggerBlinkBack() {
    setBlinkBack(true);
    setTimeout(() => setBlinkBack(false), 600);
  }

  // Use rootId so client-side re-root (e.g. SHOW_CHILDREN at max depth) takes effect immediately.
  const effectiveRootId = rootId;
  const effectiveBuildDepth =
    viewState.currentDepth ?? viewState.displayDepth ?? DEFAULT_MAX_DEPTH;
  const { root, baseX, baseY, bounds, maxDepthRendered } = useTreeBuild({
    effectiveRootId,
    viewState,
    maxDepth: effectiveBuildDepth,
    descendancyDataKey,
    builder,
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

  const treePeople = useMemo(() => {
    const nodes = collectAllPersonNodes(root);
    const withContent = nodes.filter((n) => n.content);
    const seen = new Set<string>();
    return withContent
      .map((n) => ({
        id: (n.content as { id: string; firstName: string; lastName: string }).id,
        firstName: (n.content as { id: string; firstName: string; lastName: string }).firstName,
        lastName: (n.content as { id: string; firstName: string; lastName: string }).lastName,
        x: "x" in n ? (n as { x: number }).x : undefined,
        y: "y" in n ? (n as { y: number }).y : undefined,
      }))
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
  }, [root]);

  const {
    pan,
    setPan,
    scale,
    setScale,
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
  }, []);

  const { centerOnPerson, scheduleCenterOnPerson } = usePanToPerson({
    root,
    centerOnPosition,
    bounds,
  });

  const headerNavigationDeps = useMemo(
    () => ({
      dispatch,
      onCloseDrawer: spouseDrawer.closeDrawer,
      setPan,
      triggerBlinkBack,
    }),
    [dispatch, spouseDrawer.closeDrawer, setPan, triggerBlinkBack]
  );

  // When the displayed tree changes (effective root or bounds), center and zoom on the root (e.g. after selecting from Go To Person drawer or Home)
  const boundsKey = bounds ? `${bounds.minX},${bounds.maxX},${bounds.maxY}` : "";
  useEffect(() => {
    goToInitialView();
  }, [effectiveRootId, viewState, goToInitialView, boundsKey]);

  const onActionContext: HandlePersonCardActionContext = useMemo(
    () => ({
      dispatch,
      setDrawerPersonId: spouseDrawer.setDrawerPersonId,
      setPan,
      setToast,
      setShowLegendModal: panels.setShowLegendModal,
      setShowLegendPanel: panels.setShowLegendPanel,
      setRootDisplayNames,
      triggerBlinkBack,
      settings,
      currentDepth: currentDepthRendered,
      atMaxDepth,
      maxDepth: DEFAULT_MAX_DEPTH,
      rootId: effectiveRootId,
      viewState,
      scheduleCenterOnPerson,
    }),
    [
      dispatch,
      spouseDrawer.setDrawerPersonId,
      setPan,
      setToast,
      panels.setShowLegendModal,
      panels.setShowLegendPanel,
      setRootDisplayNames,
      triggerBlinkBack,
      settings,
      currentDepthRendered,
      atMaxDepth,
      effectiveRootId,
      viewState,
      scheduleCenterOnPerson,
    ]
  );

  const onAction = useCallback(
    (action: PersonCardAction, personId: string) => {
      handlePersonCardAction(action, personId, onActionContext);
    },
    [onActionContext]
  );

  const onDrawerSelect = useCallback(
    (personId: string, spouseId: string) => {
      dispatch({ type: "DRAWER_SELECT", personId, spouseId });
      spouseDrawer.closeDrawer();
      triggerBlinkBack();
      scheduleCenterOnPerson(spouseId);
    },
    [dispatch, spouseDrawer.closeDrawer, triggerBlinkBack, scheduleCenterOnPerson]
  );

  const clearSearchAndClosePanel = useCallback(() => {
    search.setSearchGivenName("");
    search.setSearchLastName("");
    panels.setShowSearchPanel(false);
    dispatchRefreshViewport("search-database-modal");
  }, [search, panels]);

  const wrappedSetShowSearchPanel = useCallback(
    (v: boolean | ((prev: boolean) => boolean)) => {
      panels.setShowSearchPanel(v);
      if (typeof v === "boolean" && !v) dispatchRefreshViewport("search-database-modal");
    },
    [panels]
  );

  const wrappedSetShowDepthPanel = useCallback(
    (v: boolean | ((prev: boolean) => boolean)) => {
      panels.setShowDepthPanel(v);
      if (typeof v === "boolean" && !v) dispatchRefreshViewport();
    },
    [panels]
  );

  const rootActionDeps = useMemo(
    () => ({
      dispatch,
      setRootDisplayNames,
      onCloseDrawer: spouseDrawer.closeDrawer,
      setPan,
      triggerBlinkBack,
      onGoToInitialView: goToInitialView,
      clearSearchAndClosePanel,
      getPeople,
    }),
    [
      dispatch,
      setRootDisplayNames,
      spouseDrawer.closeDrawer,
      setPan,
      triggerBlinkBack,
      goToInitialView,
      clearSearchAndClosePanel,
    ]
  );

  const rootDisplayName = useMemo(() => {
    const stored = rootDisplayNames[rootId] ?? rootDisplayNames[effectiveRootId];
    if (stored) return stored;
    const p = getPeople().get(effectiveRootId);
    return p ? `${p.firstName} ${p.lastName}`.trim() : null;
  }, [rootId, effectiveRootId, rootDisplayNames]);

  // Cache derived root name so it survives builder being cleared during refetch (avoids "—" on mobile).
  useEffect(() => {
    if (rootDisplayName == null) return;
    const alreadyStored = rootDisplayNames[rootId] ?? rootDisplayNames[effectiveRootId];
    if (alreadyStored) return;
    setRootDisplayNames((prev) => ({
      ...prev,
      [rootId]: rootDisplayName,
      ...(effectiveRootId !== rootId ? { [effectiveRootId]: rootDisplayName } : {}),
    }));
  }, [rootDisplayName, rootId, effectiveRootId, rootDisplayNames]);

  const strategyName = builder?.currentStrategyName ?? "descendancy";

  return (
    <TreeNodeViewProvider strategyName={strategyName}>
    <>
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
      <div
        style={{
          overflow: "hidden",
          maxHeight: !isMobile && headerOpen ? 120 : 0,
          transition: "max-height 0.25s ease-out",
          flexShrink: 0,
        }}
      >
        <ChartHeader
          rootId={rootId}
          rootDisplayName={rootDisplayName}
          historyIndex={historyIndex}
          historyLength={history.length}
          navigationDeps={headerNavigationDeps}
          blinkBack={blinkBack}
          viewState={viewState}
          showLegendPanel={panels.showLegendPanel}
          onToggleLegendPanel={() => panels.setShowLegendPanel((p) => !p)}
        />
      </div>

      <ChartMenu
        headerOpen={headerOpen}
        onToggleHeader={() => setHeaderOpen((v) => !v)}
        isMobile={isMobile}
        rootDisplayName={rootDisplayName}
        searchGivenName={search.searchGivenName}
        searchLastName={search.searchLastName}
        onSearchGivenNameChange={search.setSearchGivenName}
        onSearchLastNameChange={search.setSearchLastName}
        searchResults={search.searchResults}
        searchLoading={search.searchLoading}
        searchHasMore={search.searchHasMore}
        searchLoadingMore={search.isSearchFetchingMore}
        onSearchLoadMore={() => void search.fetchNextPage()}
        selectedRootId={rootId}
        rootActionDeps={rootActionDeps}
        showSearchPanel={panels.showSearchPanel}
        setShowSearchPanel={wrappedSetShowSearchPanel}
        mobileSearchHref="/search"
        showHistoryPanel={panels.showHistoryPanel}
        setShowHistoryPanel={panels.setShowHistoryPanel}
        onHistoryClick={panels.toggleHistoryPanel}
        showInfo={panels.showInfo}
        setShowInfo={panels.setShowInfo}
        onInfoClick={panels.toggleInfoPanel}
        showSettings={panels.showSettings}
        setShowSettings={panels.setShowSettings}
        onSettingsClick={panels.toggleSettingsPanel}
        onGoToPerson={() => setGoToPersonDrawerOpen(true)}
        onToggleAllSpouses={() => {
          dispatch({
            type: isAllSpousesRevealed(viewState.revealedUnions) ? "CLOSE_ALL_SPOUSES" : "REVEAL_ALL_SPOUSES",
          });
        }}
      />

      {builder == null ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--tree-bg)",
            color: "var(--tree-fg)",
          }}
          aria-live="polite"
        >
          {isDescendancyLoading ? (
            <span>Loading tree…</span>
          ) : (
            <span>Unable to load tree. Check your connection or try another root.</span>
          )}
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            visibility: isMobile && panels.showSearchPanel ? "hidden" : "visible",
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
            onAction={onAction}
            settings={settings}
            connectors={builder.getCurrentStrategy()?.connectors}
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
                type: isAllSpousesRevealed(viewState.revealedUnions) ? "CLOSE_ALL_SPOUSES" : "REVEAL_ALL_SPOUSES",
              });
            }}
            shiftGoToPersonUp={!isMobile && headerOpen}
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

      <ToastMessage toast={toast} onDismiss={() => setToast(null)} />

      {panels.showDebugPanel && (
        <DebugPanel state={state} onClose={() => panels.setShowDebugPanel(false)} />
      )}

      <ChartPanels
        showHistoryPanel={panels.showHistoryPanel}
        onCloseHistoryPanel={() => panels.setShowHistoryPanel(false)}
        history={history}
        historyIndex={historyIndex}
        onNavigateHistory={(i) => {
          dispatch({ type: "NAVIGATE_TO_INDEX", index: i });
          spouseDrawer.closeDrawer();
          setPan({ x: 0, y: 0 });
        }}
        showInfo={panels.showInfo}
        onCloseInfo={() => panels.setShowInfo(false)}
        root={root}
        rootDisplayName={rootDisplayName}
        maxDepth={effectiveMaxDepth}
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
      />

      {spouseDrawer.drawerPersonId && (
        <SpouseDrawer
          personId={spouseDrawer.drawerPersonId}
          viewState={viewState}
          onSelect={onDrawerSelect}
          onClose={() => {
            spouseDrawer.closeDrawer();
            dispatchRefreshViewport();
          }}
        />
      )}

      <GoToPersonDrawer
        open={goToPersonDrawerOpen}
        people={treePeople}
        rootId={effectiveRootId}
        onClose={() => {
          setGoToPersonDrawerOpen(false);
          dispatchRefreshViewport();
        }}
        onSelectPerson={(personId, layoutX, layoutY) => {
          if (layoutX != null && layoutY != null) {
            centerOnPosition(layoutX, layoutY);
          } else {
            centerOnPerson(personId);
          }
          setGoToPersonDrawerOpen(false);
          dispatchRefreshViewport();
        }}
      />
    </div>
    </>
    </TreeNodeViewProvider>
  );
}
