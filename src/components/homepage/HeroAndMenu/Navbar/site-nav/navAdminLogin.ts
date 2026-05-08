import { SITE_ADMIN_ORIGIN } from "@/lib/siteAdminLogin";

export const NAV_ADMIN_USERNAME_KEY = "gonsalves-site-nav-admin-username";

export function readStoredAdminUsername(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NAV_ADMIN_USERNAME_KEY) ?? "";
}

export async function submitNavAdminLogin(input: {
  username: string;
  password: string;
  remember: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${SITE_ADMIN_ORIGIN}/api/auth/login`, {
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
    window.location.href = `${SITE_ADMIN_ORIGIN}/admin`;
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not reach admin. Check your connection or try the full sign-in page.",
    };
  }
}
