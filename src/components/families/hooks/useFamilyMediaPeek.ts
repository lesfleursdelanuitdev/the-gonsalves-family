"use client";

import { useCallback, useEffect, useState } from "react";
import type { IndividualMediaPeekItem } from "@/components/TreeViewer/v2/PersonDetailOverlay/types";

export const FAMILY_MEDIA_PEEK_SAMPLE_LIMIT = 3;

export type FamilyMediaPeek = {
  familyId: string;
  albumTitle: string;
  totalCount: number;
  samples: IndividualMediaPeekItem[];
};

export function useFamilyMediaPeek(familyId: string) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [data, setData] = useState<FamilyMediaPeek | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sampleShuffleNonce, setSampleShuffleNonce] = useState(0);
  const [samplesRefetchBusy, setSamplesRefetchBusy] = useState(false);

  useEffect(() => {
    setSampleShuffleNonce(0);
  }, [familyId]);

  useEffect(() => {
    let cancelled = false;
    const isFullReload = sampleShuffleNonce === 0;

    if (isFullReload) {
      setStatus("loading");
      setData(null);
      setError(null);
    } else {
      setSamplesRefetchBusy(true);
    }

    fetch(`/api/tree/families/${encodeURIComponent(familyId)}/media`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((b: { error?: string }) => Promise.reject(new Error(b.error ?? res.statusText)));
        }
        return res.json();
      })
      .then((json: FamilyMediaPeek) => {
        if (!cancelled) {
          setData(json);
          setStatus("success");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setStatus("error");
        }
      })
      .finally(() => {
        if (!cancelled) setSamplesRefetchBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [familyId, sampleShuffleNonce]);

  const randomizeSamples = useCallback(() => {
    setSampleShuffleNonce((n) => n + 1);
  }, []);

  return { status, data, error, randomizeSamples, samplesRefetchBusy };
}
