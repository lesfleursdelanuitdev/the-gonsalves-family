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
 * Absolute URL for `gedcom_media_v2.file_ref` values that are site-relative under `/uploads/…`
 * (served by **the-gonsalves-family-admin**, not this app). Uses `NEXT_PUBLIC_LIGNOUS_FRONTEND_URL`
 * as the origin (name is historical; set it to e.g. `https://admin.gonsalvesfamily.com` in production).
 */
export function resolveGedcomMediaFileRef(fileRef: string | null | undefined): string {
  const ref = (fileRef ?? "").trim();
  if (!ref) return "";
  if (/^https?:\/\//i.test(ref)) return ref;
  const path = ref.startsWith("/") ? ref : `/${ref}`;
  const base = LIGNOUS_BASE.replace(/\/$/, "");
  // All non-absolute GEDCOM media paths live on the admin/ligneous server,
  // regardless of whether they are under /uploads/ or another directory.
  if (base) {
    return `${base}${path}`;
  }
  return path;
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
