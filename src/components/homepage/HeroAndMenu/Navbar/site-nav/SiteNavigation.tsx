"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { HamburgerButton } from "@/components/navbar/HamburgerButton";
import { SITE_NAV_SEARCH_HREF } from "./navConfig";
import { DesktopNav } from "./DesktopNav";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { createSiteNavGroupState, type SiteNavGroupId } from "./navGroupState";

export function SiteNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [groupExpanded, setGroupExpanded] = React.useState(createSiteNavGroupState);
  const [loginExpanded, setLoginExpanded] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) return;
    setGroupExpanded(createSiteNavGroupState());
    setLoginExpanded(false);
  }, [menuOpen]);

  const onGroupToggle = (id: SiteNavGroupId) => {
    setGroupExpanded((prev) => ({ ...createSiteNavGroupState(), [id]: !prev[id] }));
  };

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
        groupExpanded={groupExpanded}
        loginExpanded={loginExpanded}
        onGroupToggle={onGroupToggle}
        onLoginToggle={() => setLoginExpanded((v) => !v)}
      />
    </>
  );
}
