/**
 * Viewport refresh for mobile: event name and dispatcher.
 * Used after closing modals/drawers to re-sync --mobile-viewport-width/height
 * and prevent layout from growing (e.g. horizontal scroll).
 * Also dispatches a delayed resize so Konva/stage can re-measure after keyboard dismisses.
 */

export const TREE_VIEWER_REFRESH_VIEWPORT = "tree-viewer-refresh-viewport";

/** Fired when viewport size was applied on mobile (so UI can show a toast). Detail: { title: string }. */
export const TREE_VIEWER_VIEWPORT_RESIZED = "tree-viewer-viewport-resized";

/** Reason for the refresh (e.g. "search-database-modal" for logging when Search database is closed). */
export type ViewportRefreshReason = "search-database-modal" | string;

export function dispatchRefreshViewport(reason?: ViewportRefreshReason): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TREE_VIEWER_REFRESH_VIEWPORT, { detail: reason != null ? { reason } : undefined })
  );
  setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 350);
}
