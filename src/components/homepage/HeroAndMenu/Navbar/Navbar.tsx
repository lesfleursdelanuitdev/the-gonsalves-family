"use client";

import * as React from "react";
import Link from "next/link";
import { Crest } from "@/components/wireframe";
import { SiteNavigation } from "./site-nav";

const STICKY_THRESHOLD_PX = 1;

type NavbarProps = { isStuck?: boolean };

export function Navbar({ isStuck: isStuckProp }: NavbarProps) {
  const [scrollStuck, setScrollStuck] = React.useState(false);
  const isStuck = isStuckProp ?? scrollStuck;

  React.useEffect(() => {
    const onScroll = () => setScrollStuck(window.scrollY > STICKY_THRESHOLD_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-[9999] flex h-[var(--mobile-nav-height)] min-h-[var(--mobile-nav-height)] min-w-0 max-w-full items-center justify-between overflow-x-clip px-4 py-1 transition-all duration-300 sm:h-auto sm:min-h-14 sm:px-6 sm:py-2 ${
          isStuck
            ? "bg-bg/80 dark:bg-bg/80 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
            : "bg-bg/10 dark:bg-bg/10"
        }`}
        style={{ "--mobile-nav-height": "60px" } as React.CSSProperties}
      >
        <Link
          href="/"
          className="flex shrink-0 no-underline"
          aria-label="Go to home"
        >
          <span className="my-1 block sm:my-4">
            <span className="block sm:hidden">
              <Crest size="xs" alt="Gonsalves family crest" />
            </span>
            <span className="hidden sm:block">
              <Crest size="sm" alt="Gonsalves family crest" />
            </span>
          </span>
        </Link>
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex max-w-[calc(100%-8rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[2px] text-center md:hidden">
          <span
            className="font-heading font-semibold tracking-tight text-[color:var(--heading)]"
            style={{ fontSize: 14, lineHeight: 1 }}
          >
            <span className="font-normal italic">The</span> Gonsalves{" "}
            <span className="font-normal italic">of</span> Guyana
          </span>
          <span
            className="whitespace-nowrap font-body font-semibold uppercase text-crimson"
            style={{ fontSize: 8, letterSpacing: "0.12em", lineHeight: 1 }}
          >
            A living family archive
          </span>
        </div>
        <SiteNavigation />
      </nav>
    </>
  );
}
