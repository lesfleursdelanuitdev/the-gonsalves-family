"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { PersonDetailOverlayPerson } from "./types";
import { normalizeGedcomXref, personRootHref, stripSlashesFromName } from "./utils";

const linkStyle: CSSProperties = {
  color: "var(--tree-root, #8b2e2e)",
  fontWeight: 600,
  textDecoration: "underline",
};

interface PersonNameLinkProps {
  xref: string;
  name: string | null;
  /** When provided (e.g. from the person overlay), opens that person in the overlay instead of navigating away. */
  onNavigateToPerson?: (person: PersonDetailOverlayPerson) => void;
}

export function PersonNameLink({ xref, name, onNavigateToPerson }: PersonNameLinkProps) {
  const label = stripSlashesFromName(name);
  const canonicalXref = normalizeGedcomXref(xref);

  if (!canonicalXref) {
    return <span style={linkStyle}>{label}</span>;
  }

  const payload: PersonDetailOverlayPerson = {
    name: label,
    xref: canonicalXref,
    uuid: null,
  };

  if (onNavigateToPerson) {
    return (
      <button
        type="button"
        onClick={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          onNavigateToPerson(payload);
        }}
        style={{
          ...linkStyle,
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          font: "inherit",
          cursor: "pointer",
          textAlign: "inherit",
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <Link href={personRootHref(canonicalXref, name)} style={linkStyle}>
      {label}
    </Link>
  );
}
