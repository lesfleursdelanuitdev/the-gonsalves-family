import path from "node:path";

/**
 * On-disk serving for public media referenced as site-relative `/uploads/...` paths.
 *
 * These files physically live under `/mnt/storage/uploads/{gedcom-admin,site-media}/...`
 * (written by the-gonsalves-family-admin). nginx fast-serves them for direct browser hits,
 * but Next's image optimizer self-fetches local `/uploads/...` URLs from THIS app over the
 * loopback — bypassing nginx — so the app must also be able to serve them. These route
 * handlers cover that case. `user-media` is intentionally NOT served here (private).
 *
 * Mirrors the disk layout + safe path rules used by the admin app's storage lib.
 */
const PRODUCTION_DEFAULT_UPLOADS_PARENT = "/mnt/storage/uploads";

function uploadsParentDir(): string {
  const fromEnv = process.env.MEDIA_FILES_ROOT?.trim();
  if (fromEnv) {
    const resolved = path.resolve(fromEnv);
    if (process.env.NODE_ENV === "production" && !resolved.startsWith("/mnt/")) {
      throw new Error(
        `MEDIA_FILES_ROOT must resolve under /mnt/ in production (got: ${resolved}). Example: /mnt/storage/uploads`,
      );
    }
    return resolved;
  }
  if (process.env.NODE_ENV === "production") {
    return path.resolve(PRODUCTION_DEFAULT_UPLOADS_PARENT);
  }
  return path.join(process.cwd(), "public", "uploads");
}

const STORE_CATEGORIES = ["images", "documents", "audio", "videos"] as const;
function isStoreCategory(s: string): boolean {
  return (STORE_CATEGORIES as readonly string[]).includes(s);
}

function isSafeSegment(name: string): boolean {
  if (!name || name.length > 300) return false;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) return false;
  return /^[\w.\-+() ]+$/.test(name);
}

/**
 * Resolve `<base>/<...segments>` to an absolute disk path, allowing only:
 *   - legacy `<file>`
 *   - `<category>/<file>`
 *   - `<category>/originals/<file>`
 * Returns null for anything else (traversal, unknown category, too deep).
 */
function resolveCategorized(baseDir: string, segments: string[]): string | null {
  if (segments.length === 0) return null;
  for (const seg of segments) {
    if (!isSafeSegment(seg)) return null;
  }
  if (segments.length === 1) {
    return path.join(baseDir, segments[0]!);
  }
  if (segments.length === 2) {
    const [category, filename] = segments;
    if (!category || !filename || !isStoreCategory(category)) return null;
    return path.join(baseDir, category, filename);
  }
  if (segments.length === 3) {
    const [category, originals, filename] = segments;
    if (originals !== "originals") return null;
    if (!category || !filename || !isStoreCategory(category)) return null;
    return path.join(baseDir, category, originals, filename);
  }
  return null;
}

export function resolveGedcomAdminDiskPath(segments: string[]): string | null {
  return resolveCategorized(path.join(uploadsParentDir(), "gedcom-admin"), segments);
}

export function resolveSiteMediaDiskPath(segments: string[]): string | null {
  return resolveCategorized(path.join(uploadsParentDir(), "site-media"), segments);
}

export function guessContentType(filename: string): string {
  const n = filename.toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".avif")) return "image/avif";
  if (n.endsWith(".bmp")) return "image/bmp";
  if (n.endsWith(".heic")) return "image/heic";
  if (n.endsWith(".heif")) return "image/heif";
  if (n.endsWith(".svg")) return "image/svg+xml";
  if (n.endsWith(".tif") || n.endsWith(".tiff")) return "image/tiff";
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".mp4")) return "video/mp4";
  if (n.endsWith(".webm")) return "video/webm";
  if (n.endsWith(".mov") || n.endsWith(".qt")) return "video/quicktime";
  if (n.endsWith(".mp3")) return "audio/mpeg";
  if (n.endsWith(".wav")) return "audio/wav";
  if (n.endsWith(".ogg") || n.endsWith(".oga")) return "audio/ogg";
  if (n.endsWith(".m4a") || n.endsWith(".aac")) return "audio/mp4";
  if (n.endsWith(".flac")) return "audio/flac";
  if (n.endsWith(".opus")) return "audio/opus";
  return "application/octet-stream";
}
