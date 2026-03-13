"use client";

import Link from "next/link";
import { Search } from "lucide-react";

type SearchLinkProps = {
  href: string;
  active: boolean;
  showSeparator?: boolean;
};

export function SearchLink({ href, active, showSeparator }: SearchLinkProps) {
  return (
    <span className="flex items-center">
      {showSeparator && (
        <span className="px-1.5 text-subtle" aria-hidden>
          •
        </span>
      )}
      <Link
        href={href}
        aria-label="Search"
        className={`p-2 rounded transition no-underline inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg ${
          active ? "text-primary" : "text-muted hover:text-primary"
        }`}
      >
        <Search size={16} strokeWidth={2} />
      </Link>
    </span>
  );
}
