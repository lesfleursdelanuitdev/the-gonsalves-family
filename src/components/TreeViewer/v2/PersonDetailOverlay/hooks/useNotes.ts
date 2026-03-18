"use client";

import { useEffect, useState } from "react";
import type { NotesResponse } from "../types";

export function useNotes(xref: string) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [data, setData] = useState<NotesResponse["notes"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    const encoded = encodeURIComponent(xref);
    fetch(`/api/tree/individuals/${encoded}/detail/notes`)
      .then((res) => {
        if (!res.ok) return res.json().then((b: { error?: string }) => Promise.reject(new Error(b.error ?? res.statusText)));
        return res.json();
      })
      .then((json: NotesResponse) => {
        if (!cancelled) {
          setData(json.notes);
          setStatus("success");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [xref]);

  return { status, data, error };
}
