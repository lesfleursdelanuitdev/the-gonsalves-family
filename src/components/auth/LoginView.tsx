"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Footer } from "@/components/homepage";
import { PageContainer, Section } from "@/components/wireframe";
import { PublicSiteLoginForm } from "@/components/auth/PublicSiteLoginForm";

function LoginFormShell({ safeReturnTo }: { safeReturnTo: string | null }) {
  return (
    <Suspense fallback={<div className="min-h-[280px] animate-pulse rounded-2xl bg-surface/60" aria-hidden />}>
      <PublicSiteLoginForm variant="page" returnTo={safeReturnTo} idPrefix="login-page" />
    </Suspense>
  );
}

export function LoginView({ safeReturnTo }: { safeReturnTo: string | null }) {
  const [sessionChecked, setSessionChecked] = React.useState(false);
  const [userLabel, setUserLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const body = (await res.json().catch(() => ({}))) as { user?: { username?: string; email?: string } | null };
        if (!cancelled && body.user) {
          const u = body.user.username?.trim() || body.user.email?.trim() || null;
          setUserLabel(u);
        }
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const continueHref = safeReturnTo && safeReturnTo !== "" ? safeReturnTo : "/";

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text">
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section className="relative min-w-0 overflow-x-hidden overflow-y-hidden pb-10 pt-28 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image
              src="/images/albumsCoverImageMobile.png"
              alt=""
              fill
              priority
              className="object-cover md:hidden"
              sizes="100vw"
            />
            <Image
              src="/images/albumsCoverImage.png"
              alt=""
              fill
              priority
              className="hidden object-cover md:block"
              sizes="100vw"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-bg/94 via-bg/72 to-bg/50 md:from-bg/88 md:to-bg/62"
              aria-hidden
            />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <div className="min-w-0 max-w-full space-y-5 sm:space-y-6">
                <nav
                  aria-label="Breadcrumb"
                  className="flex min-w-0 flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted"
                >
                  <Link href="/" className="transition hover:text-link">
                    Home
                  </Link>
                  <span className="text-subtle">/</span>
                  <span className="text-heading">Sign in</span>
                </nav>
                <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                  Sign in
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                  Access your family account. After signing in you&apos;ll return to the page you were viewing when
                  possible.
                </p>

                <div className="min-w-0 max-w-full rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-[0_10px_26px_rgba(60,45,25,0.06)] sm:p-7">
                  {!sessionChecked ? (
                    <div className="min-h-[220px] animate-pulse rounded-xl bg-surface-elevated/60" aria-busy aria-label="Checking session" />
                  ) : userLabel ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted">
                        Signed in as <span className="font-medium text-heading">{userLabel}</span>.
                      </p>
                      <Link
                        href={continueHref}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-link px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-link-hover sm:w-auto"
                      >
                        Continue
                      </Link>
                    </div>
                  ) : (
                    <LoginFormShell safeReturnTo={safeReturnTo} />
                  )}
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
