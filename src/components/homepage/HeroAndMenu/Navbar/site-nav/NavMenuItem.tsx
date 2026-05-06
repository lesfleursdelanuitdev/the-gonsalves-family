"use client";

import Link from "next/link";
import type { SiteNavItem } from "./navConfig";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type NavMenuItemProps = {
  item: SiteNavItem;
  active: boolean;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

export function NavMenuItem({
  item,
  active,
  onNavigate,
  variant = "desktop",
}: NavMenuItemProps) {
  const Icon = item.icon;
  const isMobile = variant === "mobile";

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cx(
        "group flex gap-3 rounded-md no-underline transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#C3A45A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8EFE1]",
        isMobile ? "px-3 py-2.5 pl-4" : "px-3 py-2.5",
        active
          ? "border-l-2 border-[color:var(--link)] bg-[color-mix(in_srgb,var(--surface-elevated)_88%,transparent)]"
          : "border-l-2 border-transparent hover:border-[color:var(--link)]",
        isMobile
          ? "hover:bg-[color-mix(in_srgb,#F8EFE1_75%,var(--surface-elevated))]"
          : "hover:bg-[color-mix(in_srgb,#FFF9EE_92%,transparent)]"
      )}
    >
      <Icon
        size={isMobile ? 18 : 16}
        strokeWidth={2}
        className={cx(
          "shrink-0 text-[color:var(--text-muted)] transition-colors",
          "group-hover:text-[color:var(--link)]",
          active && "text-[color:var(--link)]"
        )}
        aria-hidden
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span
          className={cx(
            "font-medium leading-snug transition-colors",
            isMobile ? "text-sm" : "text-sm",
            active ? "text-[color:var(--link)]" : "text-[color:var(--text)]",
            "group-hover:text-[color:var(--link)]"
          )}
        >
          {item.label}
        </span>
        <span
          className={cx(
            "leading-snug text-[color:var(--text-muted)]",
            isMobile ? "text-xs" : "text-[11px] sm:text-xs"
          )}
        >
          {item.description}
        </span>
      </span>
    </Link>
  );
}
