"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Crest } from "@/components/wireframe";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavItem = { label: string; href: string };

const NAV_LEFT: NavItem[] = [
  { label: "Tree", href: "/tree" },
  { label: "Stories", href: "/stories" },
];
const NAV_RIGHT: NavItem[] = [
  { label: "Archive", href: "/archive" },
  { label: "Culture", href: "/culture" },
  { label: "Search", href: "/search" },
];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const leftItems = useMemo(
    () => NAV_LEFT.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const rightItems = useMemo(
    () => NAV_RIGHT.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const allItems = useMemo(
    () => [...NAV_LEFT, ...NAV_RIGHT].map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );

  return (
    <header className="relative z-10 w-full">
      <div className="relative font-heading bg-bg text-text py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.08)] overflow-visible">
        <div className="relative mx-auto w-full max-w-5xl px-6">
          <div className="flex min-h-12 items-center gap-4">
            {/* Left: small crest + brand + nav links */}
            <div className="flex items-center gap-6 shrink-0">
              <Link href="/" className="flex items-center gap-3 no-underline shrink-0">
                <Crest size="sm" alt="Gonsalves family crest" />
                <div className="hidden sm:block leading-tight">
                  <div className="font-display text-sm font-semibold text-text">Gonsalves</div>
                  <div className="text-xs text-muted">Mahaica • Guyana</div>
                </div>
              </Link>

              {/* Left nav links with dot separators */}
              <nav className="hidden md:flex items-center gap-0 text-sm text-muted">
                {leftItems.map((it, i) => (
                  <span key={it.href} className="flex items-center">
                    {i > 0 && <span className="px-1.5 text-subtle" aria-hidden>•</span>}
                    <Link
                      href={it.href}
                      className={cx(
                        "px-1.5 py-2 rounded transition no-underline",
                        "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg",
                        it.active
                          ? "text-primary font-medium underline underline-offset-4 decoration-2 decoration-primary"
                          : "hover:text-primary hover:no-underline"
                      )}
                    >
                      {it.label}
                    </Link>
                  </span>
                ))}
              </nav>
            </div>


            {/* Right nav + Contribute */}
            <div className="hidden md:flex items-center gap-4 ml-auto shrink-0">
              <nav className="flex items-center gap-0 text-sm text-muted">
                {rightItems.map((it, i) => (
                  <span key={it.href} className="flex items-center">
                    {i > 0 && <span className="px-1.5 text-subtle" aria-hidden>•</span>}
                    <Link
                      href={it.href}
                      className={cx(
                        "px-1.5 py-2 rounded transition no-underline",
                        "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg",
                        it.active
                          ? "text-primary font-medium underline underline-offset-4 decoration-2 decoration-primary"
                          : "hover:text-primary hover:no-underline"
                      )}
                    >
                      {it.label}
                    </Link>
                  </span>
                ))}
              </nav>
              <Link
                href="/contribute"
                className={cx(
                  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition no-underline shrink-0",
                  "bg-primary text-primary-foreground hover:bg-primary-hover",
                  "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg"
                )}
              >
                Contribute
              </Link>
            </div>

            {/* Theme + hamburger */}
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cx(
                  "md:hidden inline-flex items-center justify-center p-2 rounded-lg",
                  "border border-border bg-surface hover:bg-surface-elevated text-text",
                  "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg transition"
                )}
                aria-label="Toggle menu"
                aria-expanded={open}
              >
                <span className="relative w-5 h-5" aria-hidden>
                  <span
                    className={cx(
                      "absolute left-0 w-5 h-0.5 bg-current rounded-full transition-all duration-200 ease-out",
                      open
                        ? "top-1/2 -translate-y-1/2 rotate-45"
                        : "top-[3px]"
                    )}
                  />
                  <span
                    className={cx(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-5 h-0.5 bg-current rounded-full transition-opacity duration-200",
                      open && "opacity-0"
                    )}
                  />
                  <span
                    className={cx(
                      "absolute left-0 w-5 h-0.5 bg-current rounded-full transition-all duration-200 ease-out",
                      open
                        ? "top-1/2 -translate-y-1/2 -rotate-45"
                        : "bottom-[3px]"
                    )}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cx(
            "md:hidden border-t border-border bg-surface overflow-hidden transition-all duration-200 ease-out",
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          )}
        >
          <div className="mx-auto max-w-5xl px-6 py-3">
              <div className="grid gap-1">
                {allItems.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={cx(
                      "rounded-lg px-3 py-2 text-sm transition no-underline block",
                      it.active
                        ? "text-primary bg-surface-elevated underline underline-offset-2 decoration-2 decoration-primary"
                        : "text-text hover:bg-surface-elevated hover:text-primary hover:no-underline"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {it.label}
                  </Link>
                ))}

                <Link
                  href="/contribute"
                  className={cx(
                    "mt-2 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition no-underline",
                    "bg-primary text-primary-foreground hover:bg-primary-hover"
                  )}
                  onClick={() => setOpen(false)}
                >
                  Contribute
                </Link>
              </div>
            </div>
          </div>
      </div>
    </header>
  );
}
