"use client";

import { useEffect } from "react";
import { TREE_VIEWER_REFRESH_VIEWPORT, TREE_VIEWER_VIEWPORT_RESIZED } from "./v2/utils/viewportRefresh";

const MOBILE_MAX_WIDTH = 640;
/** Only update stored viewport size when viewport is "full" (keyboard likely closed) so the main container doesn't shrink when the keyboard opens. */
const FULL_VIEWPORT_HEIGHT_RATIO = 0.65;
/** Delays (ms) to retry viewport size after modal close — keyboard dismiss is async on iOS/Android. */
const REFRESH_DELAYS_AFTER_MODAL_CLOSE = [0, 400, 800, 1200];

/**
 * On mobile, locks html/body and syncs --mobile-viewport-height/width with the visual
 * viewport. Listens for TREE_VIEWER_REFRESH_VIEWPORT to re-apply size when modals/drawers close.
 * Uses a stable full-height captured at mount (before keyboard can open) so the ratio check
 * works on iOS Safari where window.innerHeight shrinks with the keyboard.
 */
export function LockViewportOnMobile() {
  useEffect(() => {
    const isMobile = () => typeof window !== "undefined" && window.innerWidth <= MOBILE_MAX_WIDTH;
    if (!isMobile()) return;

    // Capture the real full height before any keyboard interference (iOS innerHeight shrinks with keyboard)
    const fullHeight = window.visualViewport?.height ?? window.innerHeight;

    function setViewportSize(): { width: number; height: number } | null {
      const vv = window.visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      // Compare against the captured full height, not the live window.innerHeight
      const isFullViewport = vv ? h >= fullHeight * FULL_VIEWPORT_HEIGHT_RATIO : true;
      if (isFullViewport) {
        document.documentElement.style.setProperty("--mobile-viewport-width", `${w}px`);
        document.documentElement.style.setProperty("--mobile-viewport-height", `${h}px`);
        return { width: w, height: h };
      }
      return null;
    }

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlHeight = html.style.height;
    const prevHtmlWidth = html.style.width;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyHeight = body.style.height;
    const prevBodyWidth = body.style.width;
    const prevBodyMaxWidth = body.style.maxWidth;
    const prevBodyPosition = body.style.position;

    const refresh = (evt?: Event, options?: { skipToast?: boolean }) => {
      if (!isMobile()) return null;
      const size = setViewportSize();
      const reason = evt && "detail" in evt && evt.detail && typeof evt.detail === "object" && "reason" in evt.detail
        ? (evt.detail as { reason?: string }).reason
        : undefined;
      if (reason === "search-database-modal" && size) {
        console.log(`Search database modal closed, we resized the viewport to: ${size.width}x${size.height}`);
      }
      if (size && !options?.skipToast) {
        window.dispatchEvent(
          new CustomEvent(TREE_VIEWER_VIEWPORT_RESIZED, {
            detail: { title: `Viewport resized to ${size.width}×${size.height}` },
          })
        );
      }
      return size;
    };

    html.style.overflow = "hidden";
    html.style.height = "var(--mobile-viewport-height, 100vh)";
    html.style.width = "var(--mobile-viewport-width, 100vw)";
    body.style.overflow = "hidden";
    body.style.height = "var(--mobile-viewport-height, 100vh)";
    body.style.width = "var(--mobile-viewport-width, 100vw)";
    body.style.maxWidth = "var(--mobile-viewport-width, 100vw)";
    body.style.position = "relative";
    setViewportSize();

    const refreshHandler = (evt?: Event) => refresh(evt);
    window.visualViewport?.addEventListener("resize", refreshHandler);
    window.visualViewport?.addEventListener("scroll", refreshHandler);
    window.addEventListener("resize", refreshHandler);
    let modalCloseTimeouts: ReturnType<typeof setTimeout>[] = [];
    let toastShownForModalClose = false;
    const onRefreshViewportBound = (evt: Event) => {
      const reason = evt && "detail" in evt && evt.detail && typeof evt.detail === "object" && "reason" in evt.detail
        ? (evt.detail as { reason?: string }).reason
        : undefined;
      if (reason === "search-database-modal") {
        toastShownForModalClose = false;
        modalCloseTimeouts.forEach((t) => clearTimeout(t));
        modalCloseTimeouts = REFRESH_DELAYS_AFTER_MODAL_CLOSE.map((delay) =>
          setTimeout(() => {
            const updated = refresh(undefined, { skipToast: toastShownForModalClose });
            if (updated) toastShownForModalClose = true;
          }, delay)
        );
        return;
      }
      refresh(evt);
    };
    window.addEventListener(TREE_VIEWER_REFRESH_VIEWPORT, onRefreshViewportBound);

    return () => {
      modalCloseTimeouts.forEach((t) => clearTimeout(t));
      window.visualViewport?.removeEventListener("resize", refreshHandler);
      window.visualViewport?.removeEventListener("scroll", refreshHandler);
      window.removeEventListener("resize", refreshHandler);
      window.removeEventListener(TREE_VIEWER_REFRESH_VIEWPORT, onRefreshViewportBound);
      html.style.overflow = prevHtmlOverflow;
      html.style.height = prevHtmlHeight;
      html.style.width = prevHtmlWidth;
      html.style.removeProperty("--mobile-viewport-height");
      html.style.removeProperty("--mobile-viewport-width");
      body.style.overflow = prevBodyOverflow;
      body.style.height = prevBodyHeight;
      body.style.width = prevBodyWidth;
      body.style.maxWidth = prevBodyMaxWidth;
      body.style.position = prevBodyPosition;
    };
  }, []);

  return null;
}
