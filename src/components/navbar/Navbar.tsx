"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  TREE_MENU,
  ARCHIVE_MENU,
  CULTURE_MENU,
  NAV_LEFT,
  NAV_RIGHT,
} from "./constants";
import { NavLogo } from "./NavLogo";
import { NavDropdown } from "./NavDropdown";
import { NavLink } from "./NavLink";
import { NavSearchLink } from "./NavSearchLink";
import { HamburgerButton } from "./HamburgerButton";
import { ContributeButton } from "./ContributeButton";
import { MobileNav } from "./MobileNav";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [cultureOpen, setCultureOpen] = useState(false);
  const [treeMobileOpen, setTreeMobileOpen] = useState(false);
  const [archiveMobileOpen, setArchiveMobileOpen] = useState(false);
  const [cultureMobileOpen, setCultureMobileOpen] = useState(false);

  const leftItems = useMemo(
    () => NAV_LEFT.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const rightItems = useMemo(
    () => NAV_RIGHT.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const treeItems = useMemo(
    () => TREE_MENU.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const treeActive = pathname === "/tree" || pathname.startsWith("/tree/");
  const archiveItems = useMemo(
    () => ARCHIVE_MENU.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const archiveActive =
    pathname === "/archive" || pathname.startsWith("/archive/");
  const cultureItems = useMemo(
    () => CULTURE_MENU.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const cultureActive =
    pathname === "/culture" || pathname.startsWith("/culture/");
  const allItems = useMemo(
    () =>
      [...NAV_LEFT, ...NAV_RIGHT].map((it) => ({
        ...it,
        active: pathname === it.href,
      })),
    [pathname]
  );

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll(); // check initial state
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full">
      <div
        className={`relative font-body text-text py-3 shadow-[0_4px_24px_rgba(60,45,25,0.04),0_8px_40px_rgba(60,45,25,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.04),0_8px_40px_rgba(0,0,0,0.03)] overflow-visible transition-colors duration-200 ${
          isScrolled ? "bg-white dark:bg-bg" : "bg-white dark:bg-bg"
        }`}
      >
        <div className="relative mx-auto w-full max-w-5xl px-6">
          <div className="flex min-h-12 items-center gap-4">
            <div className="flex flex-1 md:flex-initial items-center gap-6 shrink-0 min-w-0">
              <NavLogo />

              <nav className="hidden md:flex items-center gap-0 text-xs uppercase tracking-wide text-muted">
                <NavDropdown
                  label="Tree"
                  href="/tree"
                  items={treeItems}
                  isOpen={treeOpen}
                  onOpenChange={setTreeOpen}
                  isActive={treeActive}
                />
                {leftItems.map((it) => (
                  <NavLink
                    key={it.href}
                    href={it.href}
                    label={it.label}
                    active={it.active}
                    showSeparator
                  />
                ))}
              </nav>
            </div>

            <div className="hidden md:flex items-center gap-4 ml-auto shrink-0">
              <nav className="flex items-center gap-0 text-xs uppercase tracking-wide text-muted">
                <NavDropdown
                  label="Archive"
                  href="/archive"
                  items={archiveItems}
                  isOpen={archiveOpen}
                  onOpenChange={setArchiveOpen}
                  isActive={archiveActive}
                />
                <span className="px-1.5 text-subtle" aria-hidden>
                  •
                </span>
                <NavDropdown
                  label="Culture"
                  href="/culture"
                  items={cultureItems}
                  isOpen={cultureOpen}
                  onOpenChange={setCultureOpen}
                  isActive={cultureActive}
                />
                {rightItems.map((it) =>
                  it.href === "/search" ? (
                    <NavSearchLink
                      key={it.href}
                      href={it.href}
                      active={it.active}
                      showSeparator
                    />
                  ) : (
                    <NavLink
                      key={it.href}
                      href={it.href}
                      label={it.label}
                      active={it.active}
                      showSeparator
                    />
                  )
                )}
              </nav>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
              <ThemeToggle />
              <HamburgerButton open={open} onClick={() => setOpen((v) => !v)} />
            </div>
          </div>
        </div>

        <MobileNav
          open={open}
          onClose={() => setOpen(false)}
          treeItems={treeItems}
          archiveItems={archiveItems}
          cultureItems={cultureItems}
          treeExpanded={treeMobileOpen}
          archiveExpanded={archiveMobileOpen}
          cultureExpanded={cultureMobileOpen}
          onTreeToggle={() => setTreeMobileOpen((v) => !v)}
          onArchiveToggle={() => setArchiveMobileOpen((v) => !v)}
          onCultureToggle={() => setCultureMobileOpen((v) => !v)}
          treeActive={treeActive}
          archiveActive={archiveActive}
          cultureActive={cultureActive}
          allItems={allItems}
        />
      </div>
    </header>
  );
}
