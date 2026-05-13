const MAX_RETURN_PATH_LEN = 2048;

/**
 * Validates a same-origin relative path for post-login redirect (open-redirect safe).
 * Accepts path + query only, e.g. `/media?collection=photos`.
 */
export function sanitizePublicReturnPath(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t || t.length > MAX_RETURN_PATH_LEN) return null;
  if (!t.startsWith("/")) return null;
  if (t.startsWith("//")) return null;
  if (t.includes("\\")) return null;
  const noHash = t.split("#")[0] ?? t;
  if (!noHash) return null;
  return noHash;
}

/** Avoid redirecting back to `/login` (loop). */
export function sanitizePublicReturnPathExcludingLogin(raw: string | null | undefined): string | null {
  const s = sanitizePublicReturnPath(raw);
  if (!s) return null;
  if (s === "/login" || s.startsWith("/login?")) return null;
  return s;
}

export function decodeReturnToParam(encoded: string | null | undefined): string | null {
  if (encoded == null || encoded === "") return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}
