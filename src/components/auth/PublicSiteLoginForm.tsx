"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { navHeritage } from "@/components/homepage/HeroAndMenu/Navbar/site-nav/navHeritageTokens";
import { SITE_ADMIN_LOGIN_HREF } from "@/lib/siteAdminLogin";
import { sanitizePublicReturnPathExcludingLogin } from "@/lib/auth/public-return-path";
import { readStoredAdminUsername, submitPublicSiteLogin } from "@/lib/auth/public-site-login";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type PublicSiteLoginFormVariant = "page" | "compact";

export type PublicSiteLoginFormProps = {
  variant: PublicSiteLoginFormVariant;
  /** Sanitized path+query (e.g. from server `?returnTo=`). If omitted on the login page, only current location / param logic applies. */
  returnTo?: string | null;
  /** Optional prefix for input ids (navbar vs page). */
  idPrefix?: string;
  className?: string;
  /** Called after successful login; default handler already assigns `window.location`. */
  onSuccess?: () => void;
  /** Compact: when user taps "Open full sign-in page" (close drawers, etc.). */
  onFullSignInClick?: () => void;
};

export function PublicSiteLoginForm({
  variant,
  returnTo: returnToProp,
  idPrefix = "public-login",
  className,
  onSuccess,
  onFullSignInClick,
}: PublicSiteLoginFormProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const fullSignInHref = React.useMemo(() => {
    const q = searchParams.toString();
    const path = pathname || "/";
    const combined = sanitizePublicReturnPathExcludingLogin(`${path}${q ? `?${q}` : ""}`) ?? "/";
    return `/login?returnTo=${encodeURIComponent(combined)}`;
  }, [pathname, searchParams]);

  React.useEffect(() => {
    setUsername(readStoredAdminUsername());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const explicit =
      returnToProp != null && returnToProp !== "" ? returnToProp : undefined;
    const result = await submitPublicSiteLogin({
      username,
      password,
      remember,
      returnTo: explicit,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSuccess?.();
  };

  if (variant === "compact") {
    return (
      <form
        onSubmit={handleSubmit}
        className={cx("space-y-3", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <label
            htmlFor={`${idPrefix}-user`}
            className="block text-[11px] font-medium uppercase tracking-wide text-[color:var(--text-muted)]"
          >
            Username or email
          </label>
          <input
            id={`${idPrefix}-user`}
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
            htmlFor={`${idPrefix}-pass`}
            className="block text-[11px] font-medium uppercase tracking-wide text-[color:var(--text-muted)]"
          >
            Password
          </label>
          <input
            id={`${idPrefix}-pass`}
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
        <div className="space-y-2 border-t border-[#E1D5BB]/70 pt-2 text-center">
          <Link
            href={fullSignInHref}
            className="text-[11px] font-medium text-[color:var(--link)] underline-offset-2 hover:underline"
            onClick={() => onFullSignInClick?.()}
          >
            Open full sign-in page
          </Link>
          <div>
            <Link
              href="/request-account"
              className="text-[11px] font-semibold text-[color:var(--link)] underline-offset-2 hover:underline"
              onClick={() => onFullSignInClick?.()}
            >
              Request Account
            </Link>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cx("space-y-5", className)}>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-user`} className="block text-sm font-medium text-heading">
          Username or email
        </label>
        <input
          id={`${idPrefix}-user`}
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-text outline-none transition focus:border-link focus:ring-2 focus:ring-link/25"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-pass`} className="block text-sm font-medium text-heading">
          Password
        </label>
        <input
          id={`${idPrefix}-pass`}
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-text outline-none transition focus:border-link focus:ring-2 focus:ring-link/25"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 select-none">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="size-4 rounded border-border-subtle text-link focus:ring-link/40"
        />
        <span className="text-sm text-muted">Remember me on this device</span>
      </label>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-link px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-link-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm">
        <Link href="/request-account" className="font-medium text-link underline-offset-2 hover:underline">
          Request Account
        </Link>
      </p>
      <p className="text-center text-sm text-muted">
        Prefer the admin console?{" "}
        <Link href={SITE_ADMIN_LOGIN_HREF} className="font-medium text-link underline-offset-2 hover:underline">
          Open admin sign-in
        </Link>
      </p>
    </form>
  );
}
