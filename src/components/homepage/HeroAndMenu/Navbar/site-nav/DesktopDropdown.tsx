"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { SiteNavGroup } from "./navConfig";
import { isSiteNavGroupActive, isSiteNavItemActive } from "./navActive";
import { NavMenuItem } from "./NavMenuItem";
import { navHeritage } from "./navHeritageTokens";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type DesktopDropdownProps = {
  group: SiteNavGroup;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
};

export function DesktopDropdown({ group, isOpen, onOpenChange, pathname }: DesktopDropdownProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = isSiteNavGroupActive(pathname, group);

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
      <Link
        href={group.href}
        className={cx(
          "px-2 py-2 text-xs font-medium uppercase tracking-[0.12em] transition no-underline inline-flex items-center rounded",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C3A45A] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          isActive || isOpen
            ? "text-[color:var(--link)] underline underline-offset-[5px] decoration-[color:var(--nav-underline)] decoration-2"
            : "text-[color:var(--text-muted)] hover:text-[color:var(--link)] hover:no-underline"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={`site-nav-dd-${group.id}`}
        onFocus={() => onOpenChange(true)}
      >
        {group.navLabel}
      </Link>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={`site-nav-dd-${group.id}`}
            role="region"
            aria-label={group.sectionLabel}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cx(
              "absolute top-full z-[10001] pt-2 w-[min(100vw-2rem,320px)]",
              group.alignDropdownRight ? "right-0" : "left-0"
            )}
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
                  {group.sectionLabel}
                </p>
                <ul className="max-h-[min(70vh,420px)] list-none overflow-y-auto py-1.5" role="list">
                  {group.items.map((it) => (
                    <li key={it.href} className="px-1.5">
                      <NavMenuItem
                        item={it}
                        active={isSiteNavItemActive(pathname, it.href)}
                        onNavigate={() => onOpenChange(false)}
                        variant="desktop"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
