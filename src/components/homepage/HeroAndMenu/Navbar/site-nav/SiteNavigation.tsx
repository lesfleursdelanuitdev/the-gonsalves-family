"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { HamburgerButton } from "@/components/navbar/HamburgerButton";
import { SITE_NAV_SEARCH_HREF } from "./navConfig";
import { DesktopNav } from "./DesktopNav";
import { MobileNavDrawer } from "./MobileNavDrawer";

export function SiteNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [treeExpanded, setTreeExpanded] = React.useState(false);
  const [archiveExpanded, setArchiveExpanded] = React.useState(false);
  const [cultureExpanded, setCultureExpanded] = React.useState(false);
  const [loginExpanded, setLoginExpanded] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) return;
    setTreeExpanded(false);
    setArchiveExpanded(false);
    setCultureExpanded(false);
    setLoginExpanded(false);
  }, [menuOpen]);

  const searchActive = React.useMemo(
    () => pathname === SITE_NAV_SEARCH_HREF,
    [pathname]
  );

  return (
    <>
      <DesktopNav pathname={pathname} searchActive={searchActive} />
      <div className="flex items-center md:hidden">
        <HamburgerButton
          open={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          transparent
          morphToCloseWhenOpen={false}
        />
      </div>
      <MobileNavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        pathname={pathname}
        treeExpanded={treeExpanded}
        archiveExpanded={archiveExpanded}
        cultureExpanded={cultureExpanded}
        loginExpanded={loginExpanded}
        onTreeToggle={() => setTreeExpanded((v) => !v)}
        onArchiveToggle={() => setArchiveExpanded((v) => !v)}
        onCultureToggle={() => setCultureExpanded((v) => !v)}
        onLoginToggle={() => setLoginExpanded((v) => !v)}
      />
    </>
  );
}
