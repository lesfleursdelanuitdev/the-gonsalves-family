"use client";

import { useState, useCallback } from "react";
import type { TreeAction } from "@/genealogy-visualization-engine";

export interface UsePanToPartnerModalParams {
  dispatch: (action: TreeAction) => void;
}

export interface UsePanToPartnerModalResult {
  showPanToPartnerModal: boolean;
  onConfirmPanToPartner: () => void;
  onClosePanToPartnerModal: () => void;
  openPanToPartnerModal: (spouseId: string) => void;
}

export function usePanToPartnerModal({
  dispatch,
}: UsePanToPartnerModalParams): UsePanToPartnerModalResult {
  const [modal, setModal] = useState<{ open: boolean; spouseId: string | null }>({
    open: false,
    spouseId: null,
  });

  const openPanToPartnerModal = useCallback((spouseId: string) => {
    setModal({ open: true, spouseId });
  }, []);

  const onClosePanToPartnerModal = useCallback(() => {
    setModal({ open: false, spouseId: null });
  }, []);

  const onConfirmPanToPartner = useCallback(() => {
    if (modal.spouseId) {
      dispatch({ type: "PAN_TO_PERSON", personId: modal.spouseId });
    }
    setModal({ open: false, spouseId: null });
  }, [modal.spouseId, dispatch]);

  return {
    showPanToPartnerModal: modal.open,
    onConfirmPanToPartner,
    onClosePanToPartnerModal,
    openPanToPartnerModal,
  };
}
