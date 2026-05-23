"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PersonCardAction } from "@/genealogy-visualization-engine";
import type { FanMoreClickPayload } from "../fan/fanPeekTypes";
import type { PersonDetailOverlayPerson } from "../PersonDetailOverlay";
import { dispatchRefreshViewport } from "../utils/viewportRefresh";

export interface UseChartSurfaceInteractionsParams {
  isFanDisplayFamily: boolean;
  fanPeek: FanMoreClickPayload | null;
  setFanPeek: Dispatch<SetStateAction<FanMoreClickPayload | null>>;
  setPersonDetailOverlay: Dispatch<SetStateAction<PersonDetailOverlayPerson | null>>;
  setRootDisplayNames: Dispatch<SetStateAction<Record<string, string>>>;
  dispatch: (action: { type: "ROOT"; personId: string }) => void;
  setPan: (pan: { x: number; y: number }) => void;
  triggerBlinkBack: () => void;
  onAction: (action: PersonCardAction, personId: string) => void;
}

export interface ChartSurfaceInteractions {
  onNameClick: ((person: PersonDetailOverlayPerson) => void) | undefined;
  onFanMoreClick: ((payload: FanMoreClickPayload) => void) | undefined;
  onFanPeekViewProfile: () => void;
  onFanPeekMakeRoot: () => void;
  onFanPeekChooseParentFamily: () => void;
}

export function useChartSurfaceInteractions({
  isFanDisplayFamily,
  fanPeek,
  setFanPeek,
  setPersonDetailOverlay,
  setRootDisplayNames,
  dispatch,
  setPan,
  triggerBlinkBack,
  onAction,
}: UseChartSurfaceInteractionsParams): ChartSurfaceInteractions {
  useEffect(() => {
    if (!isFanDisplayFamily) setFanPeek(null);
  }, [isFanDisplayFamily, setFanPeek]);

  const onNameClick = useMemo(
    () =>
      isFanDisplayFamily
        ? undefined
        : (person: PersonDetailOverlayPerson) => setPersonDetailOverlay(person),
    [isFanDisplayFamily, setPersonDetailOverlay],
  );
  const onFanMoreClick = useMemo(
    () => (isFanDisplayFamily ? setFanPeek : undefined),
    [isFanDisplayFamily, setFanPeek],
  );

  const onFanPeekViewProfile = useCallback(() => {
    if (!fanPeek) return;
    const p = fanPeek;
    setFanPeek(null);
    setPersonDetailOverlay({ name: p.name, xref: p.xref, uuid: p.uuid });
  }, [fanPeek, setFanPeek, setPersonDetailOverlay]);

  const onFanPeekMakeRoot = useCallback(() => {
    if (!fanPeek) return;
    const p = fanPeek;
    const name = p.name.trim();
    setRootDisplayNames((prev) => ({ ...prev, [p.personId]: name }));
    dispatch({ type: "ROOT", personId: p.personId });
    setPan({ x: 0, y: 0 });
    triggerBlinkBack();
    setFanPeek(null);
    dispatchRefreshViewport();
  }, [fanPeek, setRootDisplayNames, dispatch, setPan, triggerBlinkBack, setFanPeek]);

  const onFanPeekChooseParentFamily = useCallback(() => {
    if (!fanPeek?.hasMultipleFamiliesAsChild) return;
    const id = fanPeek.personId;
    setFanPeek(null);
    onAction("pedigreeChooseParentFamily" as PersonCardAction, id);
  }, [fanPeek, onAction, setFanPeek]);

  return {
    onNameClick,
    onFanMoreClick,
    onFanPeekViewProfile,
    onFanPeekMakeRoot,
    onFanPeekChooseParentFamily,
  };
}
