"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, LogIn } from "lucide-react";
import { SITE_NAV_LOGIN_HREF } from "./navConfig";
import { navHeritage } from "./navHeritageTokens";
import { readStoredAdminUsername, submitNavAdminLogin } from "./navAdminLogin";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type MobileNavLoginAccordionProps = {
  expanded: boolean;
  onToggle: () => void;
  onLinkClick: () => void;
};

export function MobileNavLoginAccordion({
  expanded,
  onToggle,
  onLinkClick,
}: MobileNavLoginAccordionProps) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

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
    <div className="border-b border-[#E1D5BB]/90 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={cx(
          "flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors",
          "rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C3A45A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8EFE1]",
          expanded ? "text-[color:var(--link)]" : "text-[color:var(--text)]"
        )}
        aria-expanded={expanded}
        aria-controls="mobile-nav-login-panel"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <LogIn
            size={18}
            strokeWidth={2}
            className="shrink-0 text-[color:var(--text-muted)]"
            aria-hidden
          />
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">Login</span>
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={cx(
            "shrink-0 text-[color:var(--text-muted)] transition-transform duration-200",
            expanded && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <div
        id="mobile-nav-login-panel"
        className={cx(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="border-l-2 border-[color-mix(in_srgb,var(--link)_35%,#E1D5BB)] pb-3 pl-3 ml-1.5"
            inert={!expanded}
          >
            <p
              className="pb-2 pl-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: navHeritage.heritageRed }}
            >
              Admin sign-in
            </p>
            <form onSubmit={handleSubmit} className="space-y-2.5 pl-1 pr-0.5">
              <div className="space-y-1">
                <label
                  htmlFor="mobile-nav-admin-user"
                  className="block text-[10px] font-medium uppercase tracking-wide text-[color:var(--text-muted)]"
                >
                  Username or email
                </label>
                <input
                  id="mobile-nav-admin-user"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-md border border-[#E1D5BB] bg-[color-mix(in_srgb,#FFF9EE_92%,transparent)] px-2 py-1.5 text-sm text-[color:var(--text)] outline-none transition focus:border-[#C3A45A] focus:ring-1 focus:ring-[#C3A45A]/50"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="mobile-nav-admin-pass"
                  className="block text-[10px] font-medium uppercase tracking-wide text-[color:var(--text-muted)]"
                >
                  Password
                </label>
                <input
                  id="mobile-nav-admin-pass"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-[#E1D5BB] bg-[color-mix(in_srgb,#FFF9EE_92%,transparent)] px-2 py-1.5 text-sm text-[color:var(--text)] outline-none transition focus:border-[#C3A45A] focus:ring-1 focus:ring-[#C3A45A]/50"
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
                className="w-full rounded-md px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition enabled:hover:opacity-95 disabled:opacity-60"
                style={{ backgroundColor: navHeritage.crestGreen }}
              >
                {pending ? "Signing in…" : "Sign in"}
              </button>
              <p className="pt-0.5 text-center">
                <Link
                  href={SITE_NAV_LOGIN_HREF}
                  className="text-[11px] font-medium text-[color:var(--link)] underline-offset-2 hover:underline"
                  onClick={onLinkClick}
                >
                  Open full sign-in page
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
