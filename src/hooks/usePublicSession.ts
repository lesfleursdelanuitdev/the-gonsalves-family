"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionUser } from "@ligneous/auth";

type PublicSessionState = {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export function usePublicSession() {
  const [state, setState] = useState<PublicSessionState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { user?: SessionUser | null };
      const user = data.user ?? null;
      setState({
        user,
        isLoading: false,
        isAuthenticated: user != null,
      });
    } catch {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Still reload so anonymous redaction applies.
    }
    window.location.assign(window.location.pathname + window.location.search);
  }, []);

  return { ...state, refetch, signOut };
}
