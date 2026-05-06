"use client";

import { useCallback, useEffect, useState } from "react";
import type { IndividualMediaPeek } from "../types";

/** How many thumbnails `/detail/media` returns; keep in sync with API route slice size. */
export const INDIVIDUAL_MEDIA_PEEK_SAMPLE_LIMIT = 3;

export function useIndividualMediaPeek(xref: string) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [data, setData] = useState<IndividualMediaPeek | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Bump to re-fetch media (new random slice) without clearing overlay; reset when xref changes. */
  const [sampleShuffleNonce, setSampleShuffleNonce] = useState(0);
  /** True while a shuffle refetch is in flight (overlay stays populated). */
  const [samplesRefetchBusy, setSamplesRefetchBusy] = useState(false);

  useEffect(() => {
    setSampleShuffleNonce(0);
  }, [xref]);

  useEffect(() => {
    let cancelled = false;
    const encoded = encodeURIComponent(xref);
    const isFullReload = sampleShuffleNonce === 0;

    if (isFullReload) {
      setStatus("loading");
      setData(null);
      setError(null);
    } else {
      setSamplesRefetchBusy(true);
    }

    fetch(`/api/tree/individuals/${encoded}/detail/media`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((b: { error?: string }) => Promise.reject(new Error(b.error ?? res.statusText)));
        }
        return res.json();
      })
      .then((json: IndividualMediaPeek) => {
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
  }, [xref, sampleShuffleNonce]);

  const randomizeSamples = useCallback(() => {
    setSampleShuffleNonce((n) => n + 1);
  }, []);

  return { status, data, error, randomizeSamples, samplesRefetchBusy };
}
