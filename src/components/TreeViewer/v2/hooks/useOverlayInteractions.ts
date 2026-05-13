"use client";

import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FanMoreClickPayload } from "../fan/fanPeekTypes";
import type { PersonDetailOverlayPerson } from "../PersonDetailOverlay";
import { normalizeGedcomXref } from "../PersonDetailOverlay/utils";

export interface UseOverlayInteractionsParams {
  fanPeek: FanMoreClickPayload | null;
  effectiveRootId: string;
  setFanPeek: Dispatch<SetStateAction<FanMoreClickPayload | null>>;
  setPersonDetailOverlay: Dispatch<SetStateAction<PersonDetailOverlayPerson | null>>;
}

export function useOverlayInteractions({
  fanPeek,
  effectiveRootId,
  setFanPeek,
  setPersonDetailOverlay,
}: UseOverlayInteractionsParams) {
  const isFanPeekRoot = useMemo(
    () =>
      fanPeek != null &&
      normalizeGedcomXref(fanPeek.personId) === normalizeGedcomXref(effectiveRootId),
    [fanPeek, effectiveRootId]
  );

  const closeFanPeek = useCallback(() => setFanPeek(null), [setFanPeek]);
  const closePersonDetail = useCallback(() => setPersonDetailOverlay(null), [setPersonDetailOverlay]);

  const onSelectLinkedPerson = useCallback(
    (person: PersonDetailOverlayPerson) => {
      setPersonDetailOverlay((prev) => {
        if (prev != null && normalizeGedcomXref(prev.xref) === normalizeGedcomXref(person.xref)) {
          return prev;
        }
        return person;
      });
    },
    [setPersonDetailOverlay]
  );

  return {
    isFanPeekRoot,
    closeFanPeek,
    closePersonDetail,
    onSelectLinkedPerson,
  };
}
