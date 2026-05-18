"use client";

import { ChevronDown } from "lucide-react";
import type { SiteNavGroup } from "./navConfig";
import { resolveNavIcon } from "./navIcons";
import { isSiteNavGroupActive, isSiteNavItemActive } from "./navActive";
import { NavMenuItem } from "./NavMenuItem";
import { navHeritage } from "./navHeritageTokens";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type MobileNavAccordionProps = {
  group: SiteNavGroup;
  expanded: boolean;
  onToggle: () => void;
  pathname: string;
  panelId: string;
  onLinkClick: () => void;
};

export function MobileNavAccordion({
  group,
  expanded,
  onToggle,
  pathname,
  panelId,
  onLinkClick,
}: MobileNavAccordionProps) {
  const SectionIcon = resolveNavIcon(group.sectionIcon);
  const groupActive = isSiteNavGroupActive(pathname, group);

  return (
    <div className="border-b border-[#E1D5BB]/90 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={cx(
          "flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors",
          "rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C3A45A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8EFE1]",
          groupActive ? "text-[color:var(--link)]" : "text-[color:var(--text)]"
        )}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <SectionIcon
            size={18}
            strokeWidth={2}
            className="shrink-0 text-[color:var(--text-muted)]"
            aria-hidden
          />
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">
            {group.navLabel}
          </span>
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={cx(
            "shrink-0 text-[color:var(--text-muted)] transition-transform duration-200",
            expanded && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        className={cx(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="border-l-2 border-[color-mix(in_srgb,var(--link)_35%,#E1D5BB)] pb-3 pl-3 ml-1.5 space-y-0.5"
            inert={!expanded}
          >
            <p
              className="pb-2 pl-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: navHeritage.heritageRed }}
            >
              {group.sectionLabel}
            </p>
            {group.items.map((it) => (
              <NavMenuItem
                key={it.href}
                item={it}
                active={isSiteNavItemActive(pathname, it.href)}
                onNavigate={onLinkClick}
                variant="mobile"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
