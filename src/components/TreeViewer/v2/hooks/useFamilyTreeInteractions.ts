"use client";

import { useFamilyTreeActions } from "./useFamilyTreeActions";
import { useChartSurfaceInteractions } from "./useChartSurfaceInteractions";
import { useOverlayInteractions } from "./useOverlayInteractions";
import { useToggleAllSpousesAction } from "./useToggleAllSpousesAction";
import { useGoToPersonSelection } from "./useGoToPersonSelection";
import { useOverlayCloseHandlers } from "./useOverlayCloseHandlers";
import { useFamilyTreeUiCallbacks } from "./useFamilyTreeUiCallbacks";
import { usePedigreeFamcPickerActions } from "./usePedigreeFamcPickerActions";

export interface UseFamilyTreeInteractionsParams {
  familyTreeActionsParams: Parameters<typeof useFamilyTreeActions>[0];
  chartSurfaceParams: Omit<Parameters<typeof useChartSurfaceInteractions>[0], "onAction">;
  overlayParams: Parameters<typeof useOverlayInteractions>[0];
  toggleAllSpousesParams: Parameters<typeof useToggleAllSpousesAction>[0];
  goToPersonSelectionParams: Parameters<typeof useGoToPersonSelection>[0];
  overlayCloseHandlersParams: Parameters<typeof useOverlayCloseHandlers>[0];
  uiCallbacksParams: Parameters<typeof useFamilyTreeUiCallbacks>[0];
  pedigreeFamcPickerActionsParams: Parameters<typeof usePedigreeFamcPickerActions>[0];
}

export function useFamilyTreeInteractions({
  familyTreeActionsParams,
  chartSurfaceParams,
  overlayParams,
  toggleAllSpousesParams,
  goToPersonSelectionParams,
  overlayCloseHandlersParams,
  uiCallbacksParams,
  pedigreeFamcPickerActionsParams,
}: UseFamilyTreeInteractionsParams) {
  const actions = useFamilyTreeActions(familyTreeActionsParams);

  const chartSurfaceInteractions = useChartSurfaceInteractions({
    ...chartSurfaceParams,
    onAction: actions.onAction,
  });
  const overlayInteractions = useOverlayInteractions(overlayParams);
  const onToggleAllSpouses = useToggleAllSpousesAction(toggleAllSpousesParams);
  const handleSelectPerson = useGoToPersonSelection(goToPersonSelectionParams);
  const overlayCloseHandlers = useOverlayCloseHandlers(overlayCloseHandlersParams);
  const uiCallbacks = useFamilyTreeUiCallbacks(uiCallbacksParams);
  const pedigreeFamcPickerActions = usePedigreeFamcPickerActions(
    pedigreeFamcPickerActionsParams
  );

  return {
    actions,
    chartSurfaceInteractions,
    overlayInteractions,
    onToggleAllSpouses,
    handleSelectPerson,
    overlayCloseHandlers,
    uiCallbacks,
    pedigreeFamcPickerActions,
  };
}
