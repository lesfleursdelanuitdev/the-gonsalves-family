"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { NavDropdown } from "@/components/navbar/NavDropdown";
import { ARCHIVE_MENU_V2 } from "./constants";

export function ArchiveMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const items = useMemo(
    () => ARCHIVE_MENU_V2.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const isActive =
    pathname === "/archive" ||
    pathname.startsWith("/archive/") ||
    pathname === "/stories";

  return (
    <NavDropdown
      label="Archive"
      href="/archive"
      items={items}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      isActive={isActive}
    />
  );
}
