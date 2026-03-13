"use client";

import Link from "next/link";
import { MobileExpandableSection } from "./MobileExpandableSection";
import { MobileSearchForm } from "./MobileSearchForm";
import type { NavItem } from "./constants";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  treeItems: Array<NavItem & { active: boolean }>;
  archiveItems: Array<NavItem & { active: boolean }>;
  cultureItems: Array<NavItem & { active: boolean }>;
  treeExpanded: boolean;
  archiveExpanded: boolean;
  cultureExpanded: boolean;
  onTreeToggle: () => void;
  onArchiveToggle: () => void;
  onCultureToggle: () => void;
  treeActive: boolean;
  archiveActive: boolean;
  cultureActive: boolean;
  allItems: Array<NavItem & { active: boolean }>;
};

export function MobileNav({
  open,
  onClose,
  treeItems,
  archiveItems,
  cultureItems,
  treeExpanded,
  archiveExpanded,
  cultureExpanded,
  onTreeToggle,
  onArchiveToggle,
  onCultureToggle,
  treeActive,
  archiveActive,
  cultureActive,
  allItems,
}: MobileNavProps) {
  return (
    <div
      className={cx(
        "md:hidden border-t border-border bg-bg overflow-hidden transition-all duration-200 ease-out",
        open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      )}
    >
      <div className="mx-auto max-w-5xl px-6 py-3">
        <div className="grid gap-1">
          <MobileExpandableSection
            label="Tree"
            items={treeItems}
            expanded={treeExpanded}
            onToggle={onTreeToggle}
            isActive={treeActive}
            id="mobile-tree-menu"
            onLinkClick={onClose}
          />
          <MobileExpandableSection
            label="Archive"
            items={archiveItems}
            expanded={archiveExpanded}
            onToggle={onArchiveToggle}
            isActive={archiveActive}
            id="mobile-archive-menu"
            onLinkClick={onClose}
          />
          <MobileExpandableSection
            label="Culture"
            items={cultureItems}
            expanded={cultureExpanded}
            onToggle={onCultureToggle}
            isActive={cultureActive}
            id="mobile-culture-menu"
            onLinkClick={onClose}
          />

          {allItems
            .filter((it) => it.label !== "Search")
            .map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={cx(
                  "rounded-lg px-3 py-2 text-sm transition no-underline block",
                  it.active
                    ? "text-primary bg-surface-elevated underline underline-offset-2 decoration-2 decoration-primary"
                    : "text-text hover:bg-surface-elevated hover:text-primary hover:no-underline"
                )}
                onClick={onClose}
              >
                {it.label}
              </Link>
            ))}

          <MobileSearchForm onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
