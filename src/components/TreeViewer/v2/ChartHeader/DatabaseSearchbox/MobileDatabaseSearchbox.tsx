"use client";

import Link from "next/link";
import { Search } from "lucide-react";

const searchButtonStyle = {
  background: "#e5dcc8",
  border: "1px solid var(--tree-border)",
  borderRadius: 6,
  color: "var(--tree-text-muted)",
  padding: "4px 8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  textDecoration: "none" as const,
} as const;

export interface MobileDatabaseSearchboxProps {
  href: string;
  title?: string;
}

export function MobileDatabaseSearchbox({
  href,
  title = "Search the database",
}: MobileDatabaseSearchboxProps) {
  return (
    <Link href={href} title={title} style={searchButtonStyle}>
      <Search size={13} />
    </Link>
  );
}
