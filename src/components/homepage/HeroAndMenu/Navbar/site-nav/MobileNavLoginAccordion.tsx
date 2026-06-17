"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { ChevronDown, LogIn, LogOut, Mail } from "lucide-react";
import { navHeritage } from "./navHeritageTokens";
import { PublicSiteLoginForm } from "@/components/auth/PublicSiteLoginForm";
import { usePublicSession } from "@/hooks/usePublicSession";
import { usePublicUnreadMessageCount } from "@/hooks/usePublicMessages";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type MobileNavLoginAccordionProps = {
  expanded: boolean;
  onToggle: () => void;
  onLinkClick: () => void;
};

function sessionLabel(username: string, email: string): string {
  return username.trim() || email.trim() || "Member";
}

export function MobileNavLoginAccordion({
  expanded,
  onToggle,
  onLinkClick,
}: MobileNavLoginAccordionProps) {
  const { user, isAuthenticated, isLoading, signOut } = usePublicSession();
  const { data: unreadCount = 0 } = usePublicUnreadMessageCount(isAuthenticated);

  if (isLoading) {
    return (
      <div className="border-b border-[#E1D5BB]/90 px-1 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
        …
      </div>
    );
  }

  if (isAuthenticated && user) {
    const label = sessionLabel(user.username, user.email);
    return (
      <div className="border-b border-[#E1D5BB]/90 last:border-b-0">
        <button
          type="button"
          onClick={onToggle}
          className={cx(
            "flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors",
            "rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C3A45A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8EFE1]",
            expanded ? "text-[color:var(--link)]" : "text-[color:var(--text)]",
          )}
          aria-expanded={expanded}
          aria-controls="mobile-nav-member-panel"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <LogIn
              size={18}
              strokeWidth={2}
              className="shrink-0 text-[color:var(--link)]"
              aria-hidden
            />
            <span className="truncate text-xs font-semibold uppercase tracking-[0.14em]">{label}</span>
          </span>
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={cx(
              "shrink-0 text-[color:var(--text-muted)] transition-transform duration-200",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        <div
          id="mobile-nav-member-panel"
          className={cx(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-l-2 border-[color-mix(in_srgb,var(--link)_35%,#E1D5BB)] pb-3 pl-3 ml-1.5" inert={!expanded}>
              <Link
                href="/messages"
                onClick={onLinkClick}
                className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-left text-sm font-medium text-heading transition hover:bg-[color-mix(in_srgb,#FFF9EE_70%,transparent)]"
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
                onClick={() => {
                  void signOut();
                  onLinkClick();
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-left text-sm font-medium text-heading transition hover:bg-[color-mix(in_srgb,#FFF9EE_70%,transparent)]"
              >
                <LogOut size={16} aria-hidden />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[#E1D5BB]/90 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={cx(
          "flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors",
          "rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C3A45A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8EFE1]",
          expanded ? "text-[color:var(--link)]" : "text-[color:var(--text)]",
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
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <div
        id="mobile-nav-login-panel"
        className={cx(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
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
              Sign in
            </p>
            <div className="pl-1 pr-0.5">
              <Suspense
                fallback={<div className="h-32 animate-pulse rounded-md bg-[color-mix(in_srgb,#FFF9EE_60%,transparent)]" />}
              >
                <PublicSiteLoginForm variant="compact" idPrefix="mobile-nav" onFullSignInClick={onLinkClick} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
