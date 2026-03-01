"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type MobileExpandableSectionItem = {
  label: string;
  href: string;
  icon?: IconDefinition;
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
        <FontAwesomeIcon
          icon={faChevronDown}
          className={cx("w-3 transition-transform duration-200", expanded && "rotate-180")}
        />
      </button>
      <div
        id={id}
        className={cx(
          "overflow-hidden transition-all duration-200",
          expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-4 grid gap-1 border-l-2 border-border pl-3 py-1">
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
                <FontAwesomeIcon
                  icon={it.icon}
                  className="w-3 shrink-0 opacity-70"
                />
              )}
              {it.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
