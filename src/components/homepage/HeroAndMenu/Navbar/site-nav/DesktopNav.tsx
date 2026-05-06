"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { SITE_NAV_GROUPS, SITE_NAV_SEARCH_HREF } from "./navConfig";
import { DesktopDropdown } from "./DesktopDropdown";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type DesktopNavProps = {
  pathname: string;
  searchActive: boolean;
};

export function DesktopNav({ pathname, searchActive }: DesktopNavProps) {
  const [treeOpen, setTreeOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [cultureOpen, setCultureOpen] = React.useState(false);

  const setters = {
    tree: setTreeOpen,
    archive: setArchiveOpen,
    culture: setCultureOpen,
  } as const;

  const closeOthers = (id: "tree" | "archive" | "culture") => {
    if (id !== "tree") setTreeOpen(false);
    if (id !== "archive") setArchiveOpen(false);
    if (id !== "culture") setCultureOpen(false);
  };

  return (
    <div className="hidden min-w-0 shrink items-center gap-5 md:flex">
      {SITE_NAV_GROUPS.map((group) => {
        const open =
          group.id === "tree" ? treeOpen : group.id === "archive" ? archiveOpen : cultureOpen;
        const setOpen = setters[group.id];

        return (
          <DesktopDropdown
            key={group.id}
            group={group}
            isOpen={open}
            onOpenChange={(next) => {
              if (next) closeOthers(group.id);
              setOpen(next);
            }}
            pathname={pathname}
          />
        );
      })}
      <Link
        href={SITE_NAV_SEARCH_HREF}
        aria-label="Search the archive"
        className={cx(
          "inline-flex shrink-0 items-center justify-center rounded-md p-2 transition no-underline",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C3A45A] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          searchActive
            ? "text-[color:var(--link)]"
            : "text-[color:var(--text-muted)] hover:text-[color:var(--link)]"
        )}
      >
        <Search size={17} strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}
