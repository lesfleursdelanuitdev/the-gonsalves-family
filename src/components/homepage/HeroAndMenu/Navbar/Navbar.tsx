"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crest } from "@/components/wireframe";
import { HamburgerButton } from "@/components/navbar/HamburgerButton";
import { SearchLink } from "./SearchLink";
import { TreeMenu } from "./TreeMenu";
import { ArchiveMenu } from "./ArchiveMenu";
import { CultureMenu } from "./CultureMenu";
import { MobileNavPanel } from "./MobileNavPanel";
import {
  TREE_MENU,
  ARCHIVE_MENU_V2,
  CULTURE_MENU,
} from "./constants";

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
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [treeExpanded, setTreeExpanded] = React.useState(false);
  const [archiveExpanded, setArchiveExpanded] = React.useState(false);
  const [cultureExpanded, setCultureExpanded] = React.useState(false);

  const searchActive = React.useMemo(() => pathname === "/search", [pathname]);
  const treeItems = React.useMemo(
    () => TREE_MENU.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const archiveItems = React.useMemo(
    () => ARCHIVE_MENU_V2.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const cultureItems = React.useMemo(
    () => CULTURE_MENU.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const treeActive = pathname === "/tree" || pathname.startsWith("/tree/");
  const archiveActive =
    pathname === "/archive" ||
    pathname.startsWith("/archive/") ||
    pathname === "/stories";
  const cultureActive =
    pathname === "/culture" || pathname.startsWith("/culture/");

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-[9999] flex min-h-14 min-w-0 max-w-full items-center justify-between overflow-x-clip border-b border-border px-6 py-2 transition-all duration-300 ${
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
        <div className="hidden md:flex min-w-0 shrink items-center gap-0 text-xs uppercase tracking-wide text-muted">
          <TreeMenu />
          <span className="px-1.5 text-subtle" aria-hidden>
            •
          </span>
          <ArchiveMenu />
          <span className="px-1.5 text-subtle" aria-hidden>
            •
          </span>
          <CultureMenu />
          <SearchLink
            href="/search"
            active={searchActive}
            showSeparator
          />
        </div>
        <div className="flex md:hidden items-center shrink-0">
          <HamburgerButton
            open={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            transparent
          />
        </div>
      </nav>
      <MobileNavPanel
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        treeItems={treeItems}
        archiveItems={archiveItems}
        cultureItems={cultureItems}
        treeExpanded={treeExpanded}
        archiveExpanded={archiveExpanded}
        cultureExpanded={cultureExpanded}
        onTreeToggle={() => setTreeExpanded((v) => !v)}
        onArchiveToggle={() => setArchiveExpanded((v) => !v)}
        onCultureToggle={() => setCultureExpanded((v) => !v)}
        treeActive={treeActive}
        archiveActive={archiveActive}
        cultureActive={cultureActive}
        searchActive={searchActive}
      />
    </>
  );
}
