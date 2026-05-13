import {
  sanitizePublicReturnPath,
  sanitizePublicReturnPathExcludingLogin,
} from "@/lib/auth/public-return-path";

export const NAV_ADMIN_USERNAME_KEY = "gonsalves-site-nav-admin-username";

export function readStoredAdminUsername(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NAV_ADMIN_USERNAME_KEY) ?? "";
}

/** Current path + query on the public site (for post-login return). */
export function getCurrentPublicLocationReturnTo(): string {
  if (typeof window === "undefined") return "/";
  const path = window.location.pathname || "/";
  const q = window.location.search ?? "";
  const combined = `${path}${q}`;
  return sanitizePublicReturnPathExcludingLogin(combined) ?? "/";
}

export type PublicSiteLoginInput = {
  username: string;
  password: string;
  remember: boolean;
  /** If set (e.g. from `?returnTo=`), must already be a safe path; otherwise current location is used. */
  returnTo?: string | null;
};

/**
 * POST public `/api/auth/login`, persist optional username, then hard-navigate to a safe return path.
 */
export async function submitPublicSiteLogin(
  input: PublicSiteLoginInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: input.username.trim(),
        password: input.password,
        remember: input.remember,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error: typeof data.error === "string" ? data.error : "Sign-in failed",
      };
    }
    if (input.remember && input.username.trim()) {
      localStorage.setItem(NAV_ADMIN_USERNAME_KEY, input.username.trim());
    } else {
      localStorage.removeItem(NAV_ADMIN_USERNAME_KEY);
    }

    const fromParam = sanitizePublicReturnPathExcludingLogin(input.returnTo ?? null);
    const destination = fromParam ?? getCurrentPublicLocationReturnTo();
    window.location.assign(destination);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not complete sign-in. Check your connection and try again.",
    };
  }
}
