"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type MobileExpandableSectionItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  active: boolean;
};

type MobileExpandableSectionProps = {
  label: string;
  items: MobileExpandableSectionItem[];
  expanded: boolean;
  onToggle: () => void;
  isActive: boolean;
  id: string;
  onLinkClick: () => void;
};

export function MobileExpandableSection(props: MobileExpandableSectionProps) {
  const {
    label,
    items,
    expanded,
    onToggle,
    isActive,
    id,
    onLinkClick,
  } = props;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cx(
          "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition text-left",
          isActive
            ? "text-primary bg-surface-elevated"
            : "text-text hover:bg-surface-elevated hover:text-primary"
        )}
        aria-expanded={expanded}
        aria-controls={id}
      >
        <span>{label}</span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={cx("transition-transform duration-200", expanded && "rotate-180")}
        />
      </button>
      <div
        id={id}
        className={cx(
          "transition-all duration-200",
          expanded ? "max-h-80 opacity-100 overflow-y-auto" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="ml-4 grid gap-1 pl-3 py-1">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={cx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition no-underline",
                it.active
                  ? "text-primary bg-surface-elevated"
                  : "text-text hover:bg-surface-elevated hover:text-primary"
              )}
              onClick={onLinkClick}
            >
              {it.icon && (
                <it.icon size={12} className="shrink-0 opacity-70" strokeWidth={2} />
              )}
              {it.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
