"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type NavDropdownItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  active: boolean;
};

type NavDropdownProps = {
  label: string;
  href: string;
  items: NavDropdownItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isActive: boolean;
  /** Align dropdown to the right edge of the trigger (useful when near viewport edge) */
  alignRight?: boolean;
};

export function NavDropdown({
  label,
  href,
  items,
  isOpen,
  onOpenChange,
  isActive,
  alignRight = false,
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cx(
              "absolute top-full pt-1 z-50",
              alignRight ? "right-0" : "left-0"
            )}
          >
            <div className="min-w-[200px] rounded-lg border border-border bg-bg/90 dark:bg-bg/95 backdrop-blur-md py-1 shadow-lg normal-case">
              {items.map((it) => (
                <Link
                key={it.href}
                href={it.href}
                className={cx(
                  "group flex items-center gap-3 px-4 py-2 text-sm transition no-underline",
                  it.active
                    ? "text-primary bg-black/[0.04] dark:bg-white/[0.04]"
                    : "text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-primary"
                )}
              >
                {it.icon && (
                  <it.icon size={16} className="shrink-0 opacity-70" strokeWidth={2} />
                )}
                <span className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1">
                  {it.label}
                </span>
              </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
