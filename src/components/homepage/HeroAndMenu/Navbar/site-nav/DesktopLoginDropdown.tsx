"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { LogOut, Mail } from "lucide-react";
import { navHeritage } from "./navHeritageTokens";
import { PublicSiteLoginForm } from "@/components/auth/PublicSiteLoginForm";
import { usePublicSession } from "@/hooks/usePublicSession";
import { usePublicUnreadMessageCount } from "@/hooks/usePublicMessages";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type DesktopLoginDropdownProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

function sessionLabel(username: string, email: string): string {
  return username.trim() || email.trim() || "Member";
}

export function DesktopLoginDropdown({ isOpen, onOpenChange }: DesktopLoginDropdownProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, isAuthenticated, isLoading, signOut } = usePublicSession();
  const { data: unreadCount = 0 } = usePublicUnreadMessageCount(isAuthenticated);

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

  if (isLoading) {
    return (
      <span className="px-2 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
        …
      </span>
    );
  }

  if (isAuthenticated && user) {
    const label = sessionLabel(user.username, user.email);
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
            "px-2 py-2 text-xs font-medium uppercase tracking-[0.12em] transition no-underline inline-flex items-center rounded max-w-[12rem] truncate",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C3A45A] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            isOpen
              ? "text-[color:var(--link)] underline underline-offset-[5px] decoration-[color:var(--nav-underline)] decoration-2"
              : "text-[color:var(--link)] hover:underline hover:underline-offset-[5px] hover:decoration-[color:var(--nav-underline)] hover:decoration-2",
          )}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls="site-nav-member-panel"
          title={label}
        >
          {label}
        </button>
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              id="site-nav-member-panel"
              role="menu"
              aria-label="Signed in"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full z-[10001] w-[min(100vw-2rem,240px)] pt-2 right-0"
            >
              <div
                className={cx(
                  "overflow-hidden rounded-lg border border-[#E1D5BB]",
                  "bg-[color-mix(in_srgb,#F8EFE1_94%,transparent)] shadow-[0_12px_40px_rgba(45,32,18,0.12)]",
                  "backdrop-blur-md supports-[backdrop-filter]:bg-[color-mix(in_srgb,#F8EFE1_88%,transparent)]",
                )}
              >
                <p className="border-b border-[#E1D5BB]/80 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                  Signed in
                </p>
                <div className="px-2 py-2">
                  <Link
                    href="/messages"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-heading transition hover:bg-[color-mix(in_srgb,#FFF9EE_70%,transparent)]"
                  >
                    <Mail size={16} aria-hidden />
                    Messages
                    {unreadCount > 0 ? (
                      <span className="ml-auto rounded-full bg-link px-2 py-0.5 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void signOut()}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-heading transition hover:bg-[color-mix(in_srgb,#FFF9EE_70%,transparent)]"
                  >
                    <LogOut size={16} aria-hidden />
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

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
            : "text-[color:var(--text-muted)] hover:text-[color:var(--link)] hover:no-underline",
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
                  "backdrop-blur-md supports-[backdrop-filter]:bg-[color-mix(in_srgb,#F8EFE1_88%,transparent)]",
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
