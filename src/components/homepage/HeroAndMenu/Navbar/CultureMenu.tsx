"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { NavDropdown } from "@/components/navbar/NavDropdown";
import { CULTURE_MENU } from "./constants";

export function CultureMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const items = useMemo(
    () => CULTURE_MENU.map((it) => ({ ...it, active: pathname === it.href })),
    [pathname]
  );
  const isActive =
    pathname === "/culture" || pathname.startsWith("/culture/");

  return (
    <NavDropdown
      label="Culture"
      href="/culture"
      items={items}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      isActive={isActive}
      alignRight
    />
  );
}
