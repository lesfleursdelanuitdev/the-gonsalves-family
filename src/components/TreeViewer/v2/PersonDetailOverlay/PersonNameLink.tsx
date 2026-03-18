"use client";

import Link from "next/link";
import { personRootHref } from "./utils";

interface PersonNameLinkProps {
  xref: string;
  name: string | null;
}

export function PersonNameLink({ xref, name }: PersonNameLinkProps) {
  const label = name?.trim() || "Unknown";
  return (
    <Link
      href={personRootHref(xref, name)}
      style={{
        color: "var(--tree-root, #8b2e2e)",
        fontWeight: 600,
        textDecoration: "underline",
      }}
    >
      {label}
    </Link>
  );
}
