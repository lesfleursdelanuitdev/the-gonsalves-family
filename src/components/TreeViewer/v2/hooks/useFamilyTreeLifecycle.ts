"use client";

import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

const DEFAULT_TUTORIAL_SEEN_KEY = "treeViewerTutorialSeenV2";

export interface UseFamilyTreeLifecycleParams {
  rootId: string;
  setShowTutorialModal: Dispatch<SetStateAction<boolean>>;
  onRootChange: () => void;
  tutorialSeenStorageKey?: string;
  /** Embedded charts should not auto-open the getting-started tutorial. */
  embedMode?: boolean;
}

export function useFamilyTreeLifecycle({
  rootId,
  setShowTutorialModal,
  onRootChange,
  tutorialSeenStorageKey = DEFAULT_TUTORIAL_SEEN_KEY,
  embedMode = false,
}: UseFamilyTreeLifecycleParams) {
  useEffect(() => {
    if (embedMode) return;
    try {
      if (typeof window !== "undefined" && !window.localStorage.getItem(tutorialSeenStorageKey)) {
        setShowTutorialModal(true);
      }
    } catch {
      // ignore
    }
  }, [embedMode, setShowTutorialModal, tutorialSeenStorageKey]);

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
