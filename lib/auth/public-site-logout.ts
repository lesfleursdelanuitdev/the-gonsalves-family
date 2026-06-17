/**
 * POST public `/api/auth/logout`, then reload the current page.
 */
export async function submitPublicSiteLogout(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return {
        ok: false,
        error: typeof data.error === "string" ? data.error : "Sign-out failed",
      };
    }
    window.location.assign(window.location.pathname + window.location.search);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not complete sign-out. Check your connection and try again.",
    };
  }
}
