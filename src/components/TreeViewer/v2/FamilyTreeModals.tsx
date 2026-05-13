"use client";

import { PedigreeFamcPickerModal } from "./ChartHeader/ChartMenu/PedigreeFamcPickerModal";
import { FanPersonPeekModal } from "./fan/FanPersonPeekModal";
import { PersonDetailOverlay, type PersonDetailOverlayPerson } from "./PersonDetailOverlay";
import type { FanMoreClickPayload } from "./fan/fanPeekTypes";
import type { PedigreeFamcPickerState } from "./hooks/usePedigreeFamcPickerState";
import { normalizeGedcomXref } from "./PersonDetailOverlay/utils";

export interface FamilyTreeModalsProps {
  pedigreeFamcPicker: PedigreeFamcPickerState;
  onClosePedigreeFamcPicker: () => void;
  onSelectPedigreeFamcFamily: (familyXref: string) => void;
  isFanDisplayFamily: boolean;
  fanPeek: FanMoreClickPayload | null;
  isMobile: boolean;
  isFanPeekRoot: boolean;
  onCloseFanPeek: () => void;
  onViewFanPeekProfile: () => void;
  onMakeFanPeekRoot: () => void;
  onChooseFanPeekParentFamily: () => void;
  personDetailOverlay: PersonDetailOverlayPerson | null;
  onClosePersonDetail: () => void;
  onSelectLinkedPerson: (person: PersonDetailOverlayPerson) => void;
}

export function FamilyTreeModals({
  pedigreeFamcPicker,
  onClosePedigreeFamcPicker,
  onSelectPedigreeFamcFamily,
  isFanDisplayFamily,
  fanPeek,
  isMobile,
  isFanPeekRoot,
  onCloseFanPeek,
  onViewFanPeekProfile,
  onMakeFanPeekRoot,
  onChooseFanPeekParentFamily,
  personDetailOverlay,
  onClosePersonDetail,
  onSelectLinkedPerson,
}: FamilyTreeModalsProps) {
  return (
    <>
      {pedigreeFamcPicker && (
        <PedigreeFamcPickerModal
          open
          pendingStrategy={pedigreeFamcPicker.strategyName}
          families={pedigreeFamcPicker.families}
          onClose={onClosePedigreeFamcPicker}
          onSelectFamily={onSelectPedigreeFamcFamily}
          forPersonId={pedigreeFamcPicker.forPersonId ?? null}
        />
      )}
      {isFanDisplayFamily && (
        <FanPersonPeekModal
          open={fanPeek != null}
          payload={fanPeek}
          isMobile={isMobile}
          isRoot={isFanPeekRoot}
          onClose={onCloseFanPeek}
          onViewProfile={onViewFanPeekProfile}
          onMakeRoot={onMakeFanPeekRoot}
          onChooseParentFamily={onChooseFanPeekParentFamily}
        />
      )}
      {personDetailOverlay && (
        <PersonDetailOverlay
          key={normalizeGedcomXref(personDetailOverlay.xref) || personDetailOverlay.xref}
          person={personDetailOverlay}
          onClose={onClosePersonDetail}
          onSelectLinkedPerson={onSelectLinkedPerson}
          isMobile={isMobile}
        />
      )}
    </>
  );
}
