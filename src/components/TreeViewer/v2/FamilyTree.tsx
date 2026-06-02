"use client";

import { useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useChartSearch,
} from "@/genealogy-visualization-engine";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { useTreeIndividuals } from "@/hooks/useTreeData";
import { FamilyTreeScene } from "./FamilyTreeScene";
import { type PersonDetailOverlayPerson } from "./PersonDetailOverlay";
import type { FanMoreClickPayload } from "./fan/fanPeekTypes";
import { useFamilyTreeState } from "./hooks/useFamilyTreeState";
import { usePanToPartnerModal } from "./hooks/usePanToPartnerModal";
import { usePedigreeRootExpansion } from "./hooks/usePedigreeRootExpansion";
import { useFamilyDetailLoaders } from "./hooks/useFamilyDetailLoaders";
import { useFamilyTreeLifecycle } from "./hooks/useFamilyTreeLifecycle";
import { useChartFetchBuildPolicy } from "./hooks/useChartFetchBuildPolicy";
import { useChartDataFetch } from "./hooks/useChartDataFetch";
import { useChartLayoutDepth } from "./hooks/useChartLayoutDepth";
import { usePedigreeFamcPickerState } from "./hooks/usePedigreeFamcPickerState";
import { useFamilyTreeRenderProps } from "./hooks/useFamilyTreeRenderProps";
import { useFamilyTreeStrategyState } from "./hooks/useFamilyTreeStrategyState";
import { useFamilyTreeDerivedData } from "./hooks/useFamilyTreeDerivedData";
import { useFamilyTreeInteractions } from "./hooks/useFamilyTreeInteractions";
import { useFamilyTreeSyncEffects } from "./hooks/useFamilyTreeSyncEffects";
import { useFamilyTreeViewportInteractions } from "./hooks/useFamilyTreeViewportInteractions";
import { useFamilyTreeRenderPropsInput } from "./hooks/useFamilyTreeRenderPropsInput";
import { useFamilyTreeInteractionsInput } from "./hooks/useFamilyTreeInteractionsInput";
import { useFamilyTreeSyncEffectsInput } from "./hooks/useFamilyTreeSyncEffectsInput";
import { useFamilyTreeViewportInteractionsInput } from "./hooks/useFamilyTreeViewportInteractionsInput";
import { buildFamilyTreeCanvasProps } from "./hooks/buildFamilyTreeCanvasProps";
import { buildFamilyTreeModalsProps } from "./hooks/buildFamilyTreeModalsProps";
import type { PersonCardLayout, PersonCardVariant, PersonCompactCardSize } from "@/lib/person-card-layout";
import type { TreeViewerPartnersUrl } from "@/lib/treeViewerUrl";

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
  /** From `cardVariant` query. */
  initialPersonCardVariant?: PersonCardVariant | null;
  /** From `cardSize` query. */
  initialCompactCardSize?: PersonCompactCardSize | null;
  /** From `partners` query (`open` | `closed`); `null` = do not apply from URL. */
  initialPartnersUrl?: TreeViewerPartnersUrl | null;
  /** From `spouse` query — reveal this partner for root (family unit view). */
  initialRevealSpouseXref?: string | null;
  /** From `family` query — family xref for family profile links. */
  initialFamilyXref?: string | null;
  /** From `famc` query — pedigree family xref when opening in pedigree / vertical pedigree. */
  initialPedigreeFamcFamilyXref?: string | null;
  /** From `ppg` query — pedigree parent pair spacing in px. */
  initialParentPairGap?: number | null;
  /** When true: renders as a fixed-size embed (no full-screen header, no person detail overlay, no minimap). */
  embedMode?: boolean;
}

export function FamilyTree(props: FamilyTreeProps = {}) {
  const {
    initialRootId = null,
    loadSavedHistory = false,
    rootName = null,
    initialChartStrategy = null,
    initialUrlDepth = null,
    initialPersonCardLayout = null,
    initialPersonCardVariant = null,
    initialCompactCardSize = null,
    initialPartnersUrl = null,
    initialRevealSpouseXref = null,
    initialFamilyXref = null,
    initialPedigreeFamcFamilyXref = null,
    initialParentPairGap = null,
    embedMode = false,
  } = props;
  const router = useRouter();
  const embedOnNameClick = useCallback(
    (person: PersonDetailOverlayPerson) => {
      if (person.uuid) router.push(`/individuals/${encodeURIComponent(person.uuid)}`);
    },
    [router]
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [chartTypeModalOpen, setChartTypeModalOpen] = useState(false);
  const [personDetailOverlay, setPersonDetailOverlay] = useState<PersonDetailOverlayPerson | null>(null);
  const [fanPeek, setFanPeek] = useState<FanMoreClickPayload | null>(null);
  const { pedigreeFamcPicker, setPedigreeFamcPicker } = usePedigreeFamcPickerState();
  const {
    loadFamiliesAsChild,
    loadFamiliesAsSpouse,
    clearFamiliesAsChildCache,
  } = useFamilyDetailLoaders();
  const treeState = useFamilyTreeState({
    initialRootId,
    loadSavedHistory,
    rootName,
    initialChartStrategy,
    initialUrlDepth,
    initialPersonCardLayout,
    initialPersonCardVariant,
    initialCompactCardSize,
    initialPedigreeFamcFamilyXref,
    initialParentPairGap,
    initialRevealSpouseXref,
    initialFamilyXref,
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
  const {
    chartStrategy,
    isAncestorChart,
    allowsPedigreeRootExpansion,
    isFanDisplayFamily,
    treeNodeViewStrategyKey,
  } = useFamilyTreeStrategyState({ strategyName: state.strategyName });
  const effectiveRootId = rootId;
  const handleRootChangeLifecycle = useCallback(() => {
    setPedigreeFamcPicker(null);
    clearFamiliesAsChildCache();
  }, [clearFamiliesAsChildCache, setPedigreeFamcPicker]);
  const { handleCloseTutorial } = useFamilyTreeLifecycle({
    rootId,
    setShowTutorialModal,
    onRootChange: handleRootChangeLifecycle,
  });
  const {
    pedigreeFamcFromState,
    pedigreeFamcOverridesForFetch,
    chartFetchDepth,
    effectiveBuildDepth,
    pedigreeHasRoomToExpandDepth,
  } = useChartFetchBuildPolicy({
    chartStrategy,
    isAncestorChart,
    effectiveRootId,
    viewState,
  });
  const siblingViewPersonId = viewState.siblingView?.personId;
  const { isChartLoading, chartDataKey, chartAdapter, pedigreeMultiFamilyChildXrefs } =
    useChartDataFetch({
      chartStrategy,
      rootId,
      chartFetchDepth,
      siblingViewPersonId,
      pedigreeFamcFromState,
      pedigreeFamcOverridesForFetch,
      isAncestorChart,
      dispatch,
      loadFamiliesAsChild,
    });
  const search = useChartSearch({ useTreeIndividuals });
  const {
    togglePedigreeRootSiblings,
    togglePedigreeRootChildren,
    pedigreeRootSiblingsForViewport,
    pedigreeRootChildrenForViewport,
  } = usePedigreeRootExpansion({
    allowsPedigreeRootExpansion,
    effectiveRootId,
    loadFamiliesAsChild,
    loadFamiliesAsSpouse,
  });
  const {
    effectivePersonHeight,
    root,
    baseX,
    baseY,
    bounds,
    effectiveMaxDepth,
    handleMaxDepthChange,
    currentDepthRendered,
    atMaxDepth,
    displayedDepth,
    effectiveCurrentDepth,
  } = useChartLayoutDepth({
    dispatch,
    viewState,
    chartAdapter,
    chartDataKey,
    isAncestorChart,
    chartStrategy,
    isMobile,
    effectiveRootId,
    effectiveBuildDepth,
    settings,
    showRootSiblings: (pedigreeRootSiblingsForViewport?.length ?? 0) > 0,
  });
  const familyTreeViewportInteractionsInput = useFamilyTreeViewportInteractionsInput({
    svgRef,
    bounds,
    baseX,
    baseY,
    root,
    chartStrategy,
    effectiveRootId,
    viewState,
    embedMode,
  });
  const {
    pan,
    setPan,
    scale,
    zoomIn,
    zoomOut,
    fitToScreen,
    centerOnPosition,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    dragging,
    centerOnPerson,
    scheduleCenterOnPerson,
    handleChartHomeView,
    skipNextGoToInitialViewRef,
  } = useFamilyTreeViewportInteractions(familyTreeViewportInteractionsInput);
  const panToPartnerModal = usePanToPartnerModal({ dispatch });
  const familyTreeSyncEffectsInput = useFamilyTreeSyncEffectsInput({
    chartStrategy,
    rootId,
    pedigreeFamcFamilyXref: viewState.pedigreeFamcFamilyXref,
    dispatch,
    loadFamiliesAsChild,
    chartAdapter,
    isChartLoading,
    chartDataKey,
    isAncestorChart,
    effectiveCurrentDepth,
    personCardLayout: settings.personCardLayout,
    personCardVariant: settings.personCardVariant,
    compactCardSize: settings.compactCardSize,
    parentPairGap: settings.parentPairGap,
    revealedUnions: viewState.revealedUnions,
    familyUnitScope: viewState.familyUnitScope,
    initialPartnersUrl,
    initialRevealSpouseXref,
    initialFamilyXref,
  });
  const { handleChartStrategyChange } = useFamilyTreeSyncEffects(familyTreeSyncEffectsInput);
  const { treePeople, rootDisplayName, historyHandlers } = useFamilyTreeDerivedData({
    dispatch,
    closeSpouseDrawer: spouseDrawer.closeDrawer,
    setPan,
    root,
    rootId,
    effectiveRootId,
    rootDisplayNames,
    setRootDisplayNames,
    chartDataKey,
  });
  const familyTreeInteractionsInput = useFamilyTreeInteractionsInput({
    chartStrategy,
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
    handleChartHomeView,
    setToast,
    setRootDisplayNames,
    scheduleCenterOnPerson,
    effectiveRootId,
    triggerBlinkBack,
    skipNextGoToInitialViewRef,
    openPanToPartnerModal: panToPartnerModal.openPanToPartnerModal,
    setPedigreeFamcPicker,
    loadFamiliesAsChild,
    togglePedigreeRootSiblings,
    togglePedigreeRootChildren,
    isFanDisplayFamily,
    fanPeek,
    setFanPeek,
    setPersonDetailOverlay,
    setGoToPersonDrawerOpen,
    centerOnPosition,
    centerOnPerson,
    pedigreeFamcPicker,
  });
  const {
    actions,
    chartSurfaceInteractions,
    overlayInteractions,
    onToggleAllSpouses,
    handleSelectPerson,
    overlayCloseHandlers,
    uiCallbacks,
    pedigreeFamcPickerActions,
  } = useFamilyTreeInteractions(familyTreeInteractionsInput);
  const familyTreeRenderPropsInput = useFamilyTreeRenderPropsInput({
    headerOpen,
    setHeaderOpen,
    goToPersonDrawerOpen,
    isMobile,
    rootId,
    rootDisplayName,
    chartStrategy,
    handleChartStrategyChange,
    chartTypeModalOpen,
    setChartTypeModalOpen,
    setShowTutorialModal,
    viewState,
    panels,
    search,
    actions,
    state,
    historyHandlers,
    onToggleAllSpouses,
    setGoToPersonDrawerOpen,
    isChartLoading,
    svgRef,
    baseX,
    baseY,
    pan,
    scale,
    root,
    effectiveRootId,
    chartSurfaceInteractions: {
      ...chartSurfaceInteractions,
      onNameClick: embedMode ? embedOnNameClick : chartSurfaceInteractions.onNameClick,
    },
    settings,
    chartAdapter,
    effectivePersonHeight,
    dragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    zoomIn,
    zoomOut,
    fitToScreen,
    bounds,
    setPan,
    pedigreeHasRoomToExpandDepth,
    isAncestorChart,
    pedigreeMultiFamilyChildXrefs,
    pedigreeRootSiblingsForViewport,
    pedigreeRootChildrenForViewport,
    toast,
    uiCallbacks,
    effectiveMaxDepth,
    updateSetting,
    displayedDepth,
    handleMaxDepthChange,
    overlayCloseHandlers,
    spouseDrawerPersonId: spouseDrawer.drawerPersonId,
    treePeople,
    handleSelectPerson,
    showPanToPartnerModal: panToPartnerModal.showPanToPartnerModal,
    onConfirmPanToPartner: panToPartnerModal.onConfirmPanToPartner,
    onClosePanToPartnerModal: panToPartnerModal.onClosePanToPartnerModal,
    showTutorialModal,
    handleCloseTutorial,
  });
  const { familyTreeHeaderProps, chartViewportProps, familyTreeOverlaysProps } =
    useFamilyTreeRenderProps(familyTreeRenderPropsInput);
  const familyTreeCanvasProps = buildFamilyTreeCanvasProps({
    chartAdapter,
    isChartLoading,
    isMobile,
    showSearchPanel: panels.showSearchPanel,
    chartViewportProps: { ...chartViewportProps, embedMode },
  });
  const familyTreeModalsProps = buildFamilyTreeModalsProps({
    pedigreeFamcPicker,
    onClosePedigreeFamcPicker: pedigreeFamcPickerActions.closePedigreeFamcPicker,
    onSelectPedigreeFamcFamily: pedigreeFamcPickerActions.onSelectPedigreeFamcFamily,
    isFanDisplayFamily,
    fanPeek,
    isMobile,
    isFanPeekRoot: overlayInteractions.isFanPeekRoot,
    onCloseFanPeek: overlayInteractions.closeFanPeek,
    onViewFanPeekProfile: chartSurfaceInteractions.onFanPeekViewProfile,
    onMakeFanPeekRoot: chartSurfaceInteractions.onFanPeekMakeRoot,
    onChooseFanPeekParentFamily: chartSurfaceInteractions.onFanPeekChooseParentFamily,
    personDetailOverlay: embedMode ? null : personDetailOverlay,
    onClosePersonDetail: overlayInteractions.closePersonDetail,
    onSelectLinkedPerson: overlayInteractions.onSelectLinkedPerson,
  });
  return (
    <FamilyTreeScene
      treeNodeViewStrategyKey={treeNodeViewStrategyKey}
      familyTreeHeaderProps={familyTreeHeaderProps}
      familyTreeCanvasProps={familyTreeCanvasProps}
      familyTreeOverlaysProps={familyTreeOverlaysProps}
      familyTreeModalsProps={familyTreeModalsProps}
      embedMode={embedMode}
    />
  );
}
