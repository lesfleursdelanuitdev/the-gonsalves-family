"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { NavDropdown } from "@/components/navbar/NavDropdown";
import { TREE_MENU } from "./constants";

export function TreeMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const items = useMemo(
    () => TREE_MENU.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const isActive = pathname === "/tree" || pathname.startsWith("/tree/");

  return (
    <NavDropdown
      label="Tree"
      href="/tree"
      items={items}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      isActive={isActive}
    />
  );
}
