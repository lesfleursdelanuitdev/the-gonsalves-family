"use client";

import { useEffect, useState } from "react";
import type { AuthRequiredBody } from "@/lib/auth/client-auth-required";
import type { BasicPersonDetails } from "../types";

export function useBasicPersonDetails(xref: string) {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "auth_required">("loading");
  const [data, setData] = useState<BasicPersonDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginUrl, setLoginUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    setLoginUrl(null);
    const encoded = encodeURIComponent(xref);
    fetch(`/api/tree/individuals/${encoded}/detail/basic`)
      .then(async (res) => {
        if (res.status === 401) {
          const body = (await res.json()) as AuthRequiredBody;
          if (!cancelled) {
            setLoginUrl(body.loginUrl ?? null);
            setStatus("auth_required");
          }
          return null;
        }
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          return Promise.reject(new Error(body.error ?? res.statusText));
        }
        return res.json() as Promise<BasicPersonDetails>;
      })
      .then((json) => {
        if (!json || cancelled) return;
        setData(json);
        setStatus("success");
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

  return { status, data, error, loginUrl };
}
