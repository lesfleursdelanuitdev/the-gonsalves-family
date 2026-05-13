"use client";

import { useCallback, useRef } from "react";
import type { FamiliesAsChildResponse, FamiliesAsSpouseResponse } from "../PersonDetailOverlay/types";
import { normalizeGedcomXref } from "../PersonDetailOverlay/utils";

export function useFamilyDetailLoaders() {
  const familiesAsChildCacheRef = useRef<Map<string, FamiliesAsChildResponse>>(new Map());
  const familiesAsChildInflightRef = useRef<Map<string, Promise<FamiliesAsChildResponse | null>>>(
    new Map()
  );
  const familiesAsSpouseCacheRef = useRef<Map<string, FamiliesAsSpouseResponse>>(new Map());
  const familiesAsSpouseInflightRef = useRef<Map<string, Promise<FamiliesAsSpouseResponse | null>>>(
    new Map()
  );

  const loadFamiliesAsChild = useCallback(async (xref: string): Promise<FamiliesAsChildResponse | null> => {
    const key = normalizeGedcomXref(xref);
    if (!key) return null;
    const hit = familiesAsChildCacheRef.current.get(key);
    if (hit) return hit;
    let pending = familiesAsChildInflightRef.current.get(key);
    if (!pending) {
      pending = (async () => {
        try {
          const res = await fetch(`/api/tree/individuals/${encodeURIComponent(key)}/detail/families-as-child`);
          if (!res.ok) return null;
          const json = (await res.json()) as FamiliesAsChildResponse;
          familiesAsChildCacheRef.current.set(key, json);
          return json;
        } catch {
          return null;
        } finally {
          familiesAsChildInflightRef.current.delete(key);
        }
      })();
      familiesAsChildInflightRef.current.set(key, pending);
    }
    return pending;
  }, []);

  const loadFamiliesAsSpouse = useCallback(async (xref: string): Promise<FamiliesAsSpouseResponse | null> => {
    const key = normalizeGedcomXref(xref);
    if (!key) return null;
    const hit = familiesAsSpouseCacheRef.current.get(key);
    if (hit) return hit;
    let pending = familiesAsSpouseInflightRef.current.get(key);
    if (!pending) {
      pending = (async () => {
        try {
          const res = await fetch(`/api/tree/individuals/${encodeURIComponent(key)}/detail/families-as-spouse`);
          if (!res.ok) return null;
          const json = (await res.json()) as FamiliesAsSpouseResponse;
          familiesAsSpouseCacheRef.current.set(key, json);
          return json;
        } catch {
          return null;
        } finally {
          familiesAsSpouseInflightRef.current.delete(key);
        }
      })();
      familiesAsSpouseInflightRef.current.set(key, pending);
    }
    return pending;
  }, []);

  const clearFamiliesAsChildCache = useCallback(() => {
    familiesAsChildCacheRef.current.clear();
    familiesAsChildInflightRef.current.clear();
  }, []);

  const clearFamiliesAsSpouseCache = useCallback(() => {
    familiesAsSpouseCacheRef.current.clear();
    familiesAsSpouseInflightRef.current.clear();
  }, []);

  return {
    loadFamiliesAsChild,
    loadFamiliesAsSpouse,
    clearFamiliesAsChildCache,
    clearFamiliesAsSpouseCache,
  };
}
