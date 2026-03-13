/**
 * Image URL helpers for the-gonsalves-family.
 *
 * - Local images: served from this app's public/images (e.g. /images/crest.png)
 * - Ligneous images: served from ligneous-frontend (e.g. /images/foo.jpg on port 4000)
 */

const LIGNOUS_BASE = process.env.NEXT_PUBLIC_LIGNOUS_FRONTEND_URL || "";

/**
 * Path to a local image (in the-gonsalves-family public/images).
 * Use for images stored in this repo.
 */
export function localImage(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.startsWith("/images") ? p : `/images${p.startsWith("/") ? "" : "/"}${p}`;
}

/**
 * Full URL for an image hosted by ligneous-frontend.
 * Path is relative to ligneous-frontend's root (e.g. "images/foo.jpg" or "/images/shared/bar.png").
 * Returns undefined if LIGNOUS_FRONTEND_URL is not configured.
 */
export function ligneousImage(path: string): string | undefined {
  if (!LIGNOUS_BASE) return undefined;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${LIGNOUS_BASE.replace(/\/$/, "")}${normalized}`;
}

/**
 * Resolve image URL. Use "ligneous:" prefix for images from ligneous-frontend.
 * Examples:
 *   resolveImageUrl("crest.png")              -> /images/crest.png (local)
 *   resolveImageUrl("ligneous:/images/foo.jpg") -> http://localhost:4000/images/foo.jpg
 */
export function resolveImageUrl(path: string): string {
  if (path.startsWith("ligneous:")) {
    const ligneousPath = path.slice(9).trim();
    const url = ligneousImage(ligneousPath);
    if (url) return url;
  }
  return localImage(path);
}
