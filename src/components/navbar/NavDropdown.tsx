"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type NavDropdownItem = {
  label: string;
  href: string;
  icon?: IconDefinition;
  active: boolean;
};

type NavDropdownProps = {
  label: string;
  href: string;
  items: NavDropdownItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isActive: boolean;
};

export function NavDropdown({
  label,
  href,
  items,
  isOpen,
  onOpenChange,
  isActive,
}: NavDropdownProps) {
  return (
    <div
      className="relative"
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
    >
      <Link
        href={href}
        className={cx(
          "px-1.5 py-2 rounded transition no-underline inline-flex items-center",
          "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg",
          isActive
            ? "text-primary font-medium underline underline-offset-2 decoration-2 decoration-nav-underline dark:decoration-primary dark:underline-offset-4"
            : "hover:text-primary hover:no-underline"
        )}
      >
        {label}
      </Link>
      {isOpen && (
        <div className="absolute left-0 top-full pt-1 z-50">
          <div className="min-w-[200px] rounded-lg border border-border bg-bg py-1 shadow-lg normal-case">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={cx(
                  "flex items-center gap-3 px-4 py-2 text-sm transition no-underline",
                  it.active
                    ? "text-primary bg-black/[0.04] dark:bg-white/[0.04]"
                    : "text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-primary"
                )}
              >
                {it.icon && (
                  <FontAwesomeIcon
                    icon={it.icon}
                    className="w-4 shrink-0 opacity-70"
                  />
                )}
                {it.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
