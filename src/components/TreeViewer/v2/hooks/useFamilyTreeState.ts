"use client";

import { useMemo, useState, useReducer, useEffect, useCallback, useRef } from "react";
import {
  treeReducer,
  createInitialState,
} from "@/genealogy-visualization-engine";
import type { ViewState } from "@/genealogy-visualization-engine";
import type { TreeState, HistoryEntry } from "@/genealogy-visualization-engine";
import { usePanelVisibility, useSpouseDrawer } from "@/genealogy-visualization-engine";
import type { ChartSettingsV2 } from "../ChartPanels/SettingsPanel";

const TREE_HISTORY_STORAGE_KEY = "treeViewerHistoryV2";

function historyReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Map) return { __map: true, entries: [...value] };
  return value;
}

function historyReviver(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && (value as { __map?: boolean }).__map === true) {
    const v = value as { entries?: [unknown, unknown][] };
    if (Array.isArray(v.entries)) return new Map(v.entries);
  }
  return value;
}

export type ToastState = {
  title: string;
  parts: { pedi: string; names: string }[];
} | null;

const defaultSettings: ChartSettingsV2 = {
  showDates: true,
  showPhotos: true,
  showUnknown: true,
  autoLegendModal: true,
};

export interface UseFamilyTreeStateOptions {
  initialRootId?: string | null;
  /** When true and initialRootId is set, restore history from localStorage and append "Make root, rootName". */
  loadSavedHistory?: boolean;
  /** Display name for the new root when loadSavedHistory is true. */
  rootName?: string | null;
}

export function useFamilyTreeState(options: UseFamilyTreeStateOptions = {}) {
  const { initialRootId = null, loadSavedHistory = false, rootName = null } = options;

  const initialState = useMemo(
    () => createInitialState("descendancy", initialRootId ?? undefined),
    [initialRootId]
  );
  const [state, dispatch] = useReducer(treeReducer, initialState);
  const viewState = state.viewState as ViewState;
  const hasRestoredRef = useRef(false);

  // Restore history from localStorage: when no root in URL; or when loadSavedHistory=true and root is set (append "Make root, rootName").
  useEffect(() => {
    if (hasRestoredRef.current) return;
    if (typeof window === "undefined") return;
    if (initialRootId != null && !loadSavedHistory) return;

    const runRestore = () => {
      hasRestoredRef.current = true;
      try {
        const raw = window.localStorage.getItem(TREE_HISTORY_STORAGE_KEY);
        if (!raw) {
          if (initialRootId != null && loadSavedHistory) {
            // No saved history: just push "Make root, rootName" onto current state.
            const freshState = createInitialState("descendancy", initialRootId);
            const actionLabel = `Make ${rootName ?? initialRootId} root`;
            const newEntry: HistoryEntry = {
              rootId: initialRootId,
              viewState: freshState.viewState,
              actionLabel,
              rootPersonFullName: rootName ?? undefined,
              rootPersonInitials: rootName
                ? rootName
                    .split(/\s+/)
                    .map((s) => s[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : undefined,
            };
            dispatch({
              type: "RESTORE_HISTORY",
              history: [newEntry],
              historyIndex: 0,
            });
          }
          return;
        }
        const parsed = JSON.parse(raw, historyReviver) as {
          history?: HistoryEntry[];
          historyIndex?: number;
        };
        const savedHistory = Array.isArray(parsed.history) ? parsed.history : null;
        const savedIndex =
          typeof parsed.historyIndex === "number"
            ? Math.max(0, Math.min(parsed.historyIndex, (savedHistory?.length ?? 1) - 1))
            : 0;

        if (initialRootId != null && loadSavedHistory && savedHistory && savedHistory.length > 0) {
          // Append "Make root, rootName" to saved history.
          const freshState = createInitialState("descendancy", initialRootId);
          const actionLabel = `Make ${rootName ?? initialRootId} root`;
          const newEntry: HistoryEntry = {
            rootId: initialRootId,
            viewState: freshState.viewState,
            actionLabel,
            rootPersonFullName: rootName ?? undefined,
            rootPersonInitials: rootName
              ? rootName
                  .split(/\s+/)
                  .map((s) => s[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : undefined,
          };
          const newHistory = [...savedHistory, newEntry];
          const newIndex = newHistory.length - 1;
          dispatch({ type: "RESTORE_HISTORY", history: newHistory, historyIndex: newIndex });
          return;
        }

        if (initialRootId == null && savedHistory && savedHistory.length > 0) {
          dispatch({ type: "RESTORE_HISTORY", history: savedHistory, historyIndex: savedIndex });
        }
      } catch {
        // ignore
      }
    };

    if (initialRootId != null && loadSavedHistory) {
      runRestore();
      return;
    }
    if (initialRootId == null) {
      runRestore();
    }
  }, [initialRootId, loadSavedHistory, rootName]);

  // Persist history when it changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        TREE_HISTORY_STORAGE_KEY,
        JSON.stringify(
          { history: state.history, historyIndex: state.historyIndex },
          historyReplacer
        )
      );
    } catch {
      // ignore
    }
  }, [state.history, state.historyIndex]);

  const [settings, setSettingsState] = useState<ChartSettingsV2>(defaultSettings);
  const [toast, setToast] = useState<ToastState>(null);
  const [blinkBack, setBlinkBack] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [rootDisplayNames, setRootDisplayNames] = useState<
    Record<string, string>
  >({});
  const [goToPersonDrawerOpen, setGoToPersonDrawerOpen] = useState(false);

  const panels = usePanelVisibility();
  const spouseDrawer = useSpouseDrawer();

  useEffect(() => {
    const check = () =>
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof ChartSettingsV2>(key: K, value: ChartSettingsV2[K]) => {
      setSettingsState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const triggerBlinkBack = useCallback(() => {
    setBlinkBack(true);
    setTimeout(() => setBlinkBack(false), 600);
  }, []);

  return {
    state,
    dispatch,
    viewState,
    settings,
    updateSetting,
    toast,
    setToast,
    blinkBack,
    triggerBlinkBack,
    headerOpen,
    setHeaderOpen,
    isMobile,
    rootDisplayNames,
    setRootDisplayNames,
    goToPersonDrawerOpen,
    setGoToPersonDrawerOpen,
    panels,
    spouseDrawer,
  };
}
