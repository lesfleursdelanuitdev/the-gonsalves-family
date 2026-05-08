"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { SITE_ADMIN_LOGIN_HREF } from "@/lib/siteAdminLogin";
import { navHeritage } from "./navHeritageTokens";
import { readStoredAdminUsername, submitNavAdminLogin } from "./navAdminLogin";

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
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

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

  React.useEffect(() => {
    setUsername(readStoredAdminUsername());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await submitNavAdminLogin({ username, password, remember });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
    }
  };

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
            aria-label="Admin sign-in"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full z-[10001] w-[min(100vw-2rem,320px)] pt-2 right-0"
          >
            <div className="relative">
              <div
                className="pointer-events-none absolute top-0 z-10 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border border-[#E1D5BB] bg-[#F8EFE1] right-10 left-auto translate-x-0"
                aria-hidden
              />
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
                  Admin sign-in
                </p>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-3 px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-1">
                    <label
                      htmlFor="site-nav-login-user"
                      className="block text-[11px] font-medium uppercase tracking-wide text-[color:var(--text-muted)]"
                    >
                      Username or email
                    </label>
                    <input
                      id="site-nav-login-user"
                      name="username"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full rounded-md border border-[#E1D5BB] bg-[color-mix(in_srgb,#FFF9EE_92%,transparent)] px-2.5 py-2 text-sm text-[color:var(--text)] outline-none transition focus:border-[#C3A45A] focus:ring-1 focus:ring-[#C3A45A]/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="site-nav-login-pass"
                      className="block text-[11px] font-medium uppercase tracking-wide text-[color:var(--text-muted)]"
                    >
                      Password
                    </label>
                    <input
                      id="site-nav-login-pass"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-md border border-[#E1D5BB] bg-[color-mix(in_srgb,#FFF9EE_92%,transparent)] px-2.5 py-2 text-sm text-[color:var(--text)] outline-none transition focus:border-[#C3A45A] focus:ring-1 focus:ring-[#C3A45A]/50"
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="size-3.5 rounded border-[#C9B37A] text-[#2E5E3E] focus:ring-[#C3A45A]"
                    />
                    <span className="text-xs text-[color:var(--text)]">Remember me</span>
                  </label>
                  {error ? (
                    <p className="text-xs font-medium text-[#8F1F1F]" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-md px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition enabled:hover:opacity-95 disabled:opacity-60"
                    style={{ backgroundColor: navHeritage.crestGreen }}
                  >
                    {pending ? "Signing in…" : "Sign in"}
                  </button>
                  <p className="border-t border-[#E1D5BB]/70 pt-2 text-center">
                    <Link
                      href={SITE_ADMIN_LOGIN_HREF}
                      className="text-[11px] font-medium text-[color:var(--link)] underline-offset-2 hover:underline"
                      onClick={() => onOpenChange(false)}
                    >
                      Open full sign-in page
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
