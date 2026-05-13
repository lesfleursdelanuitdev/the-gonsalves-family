"use client";

import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

const DEFAULT_TUTORIAL_SEEN_KEY = "treeViewerTutorialSeenV2";

export interface UseFamilyTreeLifecycleParams {
  rootId: string;
  setShowTutorialModal: Dispatch<SetStateAction<boolean>>;
  onRootChange: () => void;
  tutorialSeenStorageKey?: string;
}

export function useFamilyTreeLifecycle({
  rootId,
  setShowTutorialModal,
  onRootChange,
  tutorialSeenStorageKey = DEFAULT_TUTORIAL_SEEN_KEY,
}: UseFamilyTreeLifecycleParams) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !window.localStorage.getItem(tutorialSeenStorageKey)) {
        setShowTutorialModal(true);
      }
    } catch {
      // ignore
    }
  }, [setShowTutorialModal, tutorialSeenStorageKey]);

  const handleCloseTutorial = useCallback(() => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(tutorialSeenStorageKey, "1");
    } catch {
      // ignore
    }
    setShowTutorialModal(false);
  }, [setShowTutorialModal, tutorialSeenStorageKey]);

  useEffect(() => {
    onRootChange();
  }, [rootId, onRootChange]);

  return { handleCloseTutorial };
}
