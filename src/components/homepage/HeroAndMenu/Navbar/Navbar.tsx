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
        className={`fixed inset-x-0 top-0 z-[9999] flex min-h-14 min-w-0 max-w-full items-center justify-between overflow-x-clip px-6 py-2 transition-all duration-300 ${
          isStuck
            ? "bg-bg/80 dark:bg-bg/80 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
            : "bg-bg/10 dark:bg-bg/10"
        }`}
      >
        <Link
          href="/"
          className="flex shrink-0 no-underline"
          aria-label="Go to home"
        >
          <span className="my-4 block">
            <Crest size="sm" alt="Gonsalves family crest" />
          </span>
        </Link>
        <SiteNavigation />
      </nav>
    </>
  );
}
