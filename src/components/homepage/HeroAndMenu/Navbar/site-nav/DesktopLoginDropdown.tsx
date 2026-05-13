"use client";

import * as React from "react";
import { Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import { navHeritage } from "./navHeritageTokens";
import { PublicSiteLoginForm } from "@/components/auth/PublicSiteLoginForm";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type DesktopLoginDropdownProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DesktopLoginDropdown({ isOpen, onOpenChange }: DesktopLoginDropdownProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) {
        onOpenChange(false);
      }
    }, 10);
  };

  React.useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        onOpenChange(true);
      }}
      onMouseLeave={() => onOpenChange(false)}
      onFocus={() => {
        clearCloseTimer();
        onOpenChange(true);
      }}
      onBlur={scheduleClose}
    >
      <button
        type="button"
        className={cx(
          "px-2 py-2 text-xs font-medium uppercase tracking-[0.12em] transition no-underline inline-flex items-center rounded",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C3A45A] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          isOpen
            ? "text-[color:var(--link)] underline underline-offset-[5px] decoration-[color:var(--nav-underline)] decoration-2"
            : "text-[color:var(--text-muted)] hover:text-[color:var(--link)] hover:no-underline"
        )}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="site-nav-login-panel"
        onFocus={() => onOpenChange(true)}
      >
        Login
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="site-nav-login-panel"
            role="dialog"
            aria-label="Sign in"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full z-[10001] w-[min(100vw-2rem,320px)] pt-2 right-0"
          >
            <div className="relative">
              <div
                className={cx(
                  "relative overflow-hidden rounded-lg border border-[#E1D5BB]",
                  "bg-[color-mix(in_srgb,#F8EFE1_94%,transparent)] shadow-[0_12px_40px_rgba(45,32,18,0.12)]",
                  "backdrop-blur-md supports-[backdrop-filter]:bg-[color-mix(in_srgb,#F8EFE1_88%,transparent)]"
                )}
              >
                <p
                  className="border-b border-[#E1D5BB]/80 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: navHeritage.heritageRed }}
                >
                  Sign in
                </p>
                <div className="px-4 py-3">
                  <Suspense
                    fallback={<div className="h-36 animate-pulse rounded-md bg-[color-mix(in_srgb,#FFF9EE_60%,transparent)]" />}
                  >
                    <PublicSiteLoginForm variant="compact" idPrefix="site-nav-desktop" onFullSignInClick={() => onOpenChange(false)} />
                  </Suspense>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
