"use client";

import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { PersonNameLink } from "./PersonNameLink";
import { GenderIcon } from "./GenderIcon";
import {
  familyGridStyle,
  familyGridHeaderRowStyle,
  familyGridSubHeaderRowStyle,
  familyGridLabelCellStyle,
  familyGridDataCellStyle,
  familyGridChildrenStyle,
  familyNumberTabBarStyle,
  familyNumberTabStyle,
  familyNumberTabSelectedStyle,
  eventsPaginationBarStyle,
  eventsPaginationButtonStyle,
  rowBorderBottom,
  noRowBorder,
  iconColor,
  iconWrapStyle,
} from "./styles";
import type { FamiliesAsChildResponse, PersonDetailOverlayPerson } from "./types";
import { normalizeGedcomXref } from "./utils";

type FamilyOfOrigin = FamiliesAsChildResponse["familiesOfOrigin"][number];

export interface FamiliesAsChildContentProps {
  familiesOfOrigin: FamilyOfOrigin[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  subjectXref: string;
  onSelectLinkedPerson?: (person: PersonDetailOverlayPerson) => void;
  isMobile?: boolean;
}

const CHILDREN_PAGE_SIZE = 5;

/** Body of “families as child” (parents, siblings, pagination) — no outer `Section`. */
export function FamiliesAsChildContent({
  familiesOfOrigin,
  selectedIndex,
  onSelectIndex,
  subjectXref,
  onSelectLinkedPerson,
  isMobile,
}: FamiliesAsChildContentProps) {
  const [childrenPage, setChildrenPage] = useState(0);

  useEffect(() => {
    setChildrenPage(0);
  }, [selectedIndex]);

  if (familiesOfOrigin.length === 0) return null;

  const fam = familiesOfOrigin[selectedIndex] ?? familiesOfOrigin[0]!;
  const wife = fam.parents.find((p) => p.role === "wife");
  const husband = fam.parents.find((p) => p.role === "husband");
  const hasTabs = familiesOfOrigin.length > 1;
  const gridFontSize = isMobile ? 13 : 14;

  const totalChildren = fam.children.length;
  const totalPages = Math.max(1, Math.ceil(totalChildren / CHILDREN_PAGE_SIZE));
  const pageIndex = Math.min(childrenPage, totalPages - 1);
  const pageChildren = fam.children.slice(
    pageIndex * CHILDREN_PAGE_SIZE,
    (pageIndex + 1) * CHILDREN_PAGE_SIZE
  );

  return (
    <>
      {hasTabs && (
        <div role="tablist" aria-label="Family" style={{ ...familyNumberTabBarStyle, marginLeft: 16 }}>
          {familiesOfOrigin.map((_, idx) => (
            <button
              key={familiesOfOrigin[idx]!.family.id}
              type="button"
              role="tab"
              aria-selected={selectedIndex === idx}
              aria-label={`Family ${idx + 1}`}
              style={selectedIndex === idx ? familyNumberTabSelectedStyle : familyNumberTabStyle}
              onClick={() => onSelectIndex(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}
      <div key={fam.family.id} style={{ ...familyGridStyle, fontSize: gridFontSize }}>
        <div
          style={{
            ...familyGridHeaderRowStyle,
            borderTop: rowBorderBottom,
          }}
        >
          {fam.parentsLabel ?? "Parents"}
        </div>
        <div style={familyGridLabelCellStyle}>Partner</div>
        <div
          style={{
            ...familyGridDataCellStyle,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {wife ? (
            <>
              <GenderIcon gender={wife.gender} />
              <PersonNameLink xref={wife.xref} name={wife.name} onNavigateToPerson={onSelectLinkedPerson} />
            </>
          ) : (
            "Unknown"
          )}
        </div>
        <div style={familyGridLabelCellStyle}>Partner</div>
        <div
          style={{
            ...familyGridDataCellStyle,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {husband ? (
            <>
              <GenderIcon gender={husband.gender} />
              <PersonNameLink xref={husband.xref} name={husband.name} onNavigateToPerson={onSelectLinkedPerson} />
            </>
          ) : (
            "Unknown"
          )}
        </div>
        <div style={familyGridSubHeaderRowStyle}>
          Children ({totalChildren})
        </div>
        <div style={familyGridChildrenStyle}>
          {pageChildren.length > 0
            ? pageChildren.map((c, idx) => {
                const isLast = idx === pageChildren.length - 1;
                const birthOrder = pageIndex * CHILDREN_PAGE_SIZE + idx + 1;
                const isSubject =
                  c.xref != null &&
                  subjectXref != null &&
                  normalizeGedcomXref(c.xref) === normalizeGedcomXref(subjectXref);
                return (
                  <div
                    key={c.xref}
                    style={{
                      ...familyGridDataCellStyle,
                      ...(isLast ? noRowBorder : {}),
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {isSubject && (
                      <span style={iconWrapStyle} aria-hidden>
                        <Star size={16} color={iconColor} />
                      </span>
                    )}
                    <GenderIcon gender={c.gender} />
                    <span
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        minWidth: "2em",
                        flexShrink: 0,
                        textAlign: "left",
                        fontWeight: 600,
                        color: "rgba(20, 83, 45, 0.72)",
                      }}
                    >
                      {birthOrder}.
                    </span>
                    <PersonNameLink xref={c.xref} name={c.name} onNavigateToPerson={onSelectLinkedPerson} />
                  </div>
                );
              })
            : (
              <div style={{ ...familyGridDataCellStyle, ...noRowBorder }}>—</div>
            )}
        </div>
        {totalPages > 1 && (
          <div
            style={{
              ...eventsPaginationBarStyle,
              gridColumn: "1 / -1",
              borderTop: rowBorderBottom,
            }}
          >
            <button
              type="button"
              style={eventsPaginationButtonStyle}
              onClick={() => setChildrenPage((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} aria-hidden />
            </button>
            <span style={{ fontSize: 13 }}>
              Page {pageIndex + 1} of {totalPages} · {totalChildren} children
            </span>
            <button
              type="button"
              style={eventsPaginationButtonStyle}
              onClick={() => setChildrenPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRight size={14} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
