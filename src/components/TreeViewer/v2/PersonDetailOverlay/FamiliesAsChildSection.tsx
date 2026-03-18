"use client";

import { useState, useEffect } from "react";
import { Home, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { PersonNameLink } from "./PersonNameLink";
import { GenderIcon } from "./GenderIcon";
import { Section } from "./Section";
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
  SECTION_BORDER_RADIUS,
  rowBorderBottom,
  noRowBorder,
  iconColor,
  iconSize,
  iconWrapStyle,
} from "./styles";
import type { FamiliesAsChildResponse } from "./types";

type FamilyOfOrigin = FamiliesAsChildResponse["familiesOfOrigin"][number];

interface FamiliesAsChildSectionProps {
  familiesOfOrigin: FamilyOfOrigin[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  subjectXref: string;
  isMobile?: boolean;
}

const CHILDREN_PAGE_SIZE = 5;

function normalizeXref(xref: string | null | undefined): string {
  if (xref == null || typeof xref !== "string") return "";
  const s = xref.trim();
  return s === "" ? "" : s.startsWith("@") ? s : `@${s}@`;
}

export function FamiliesAsChildSection({
  familiesOfOrigin,
  selectedIndex,
  onSelectIndex,
  subjectXref,
  isMobile,
}: FamiliesAsChildSectionProps) {
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
    <Section
      icon={<Home size={iconSize} color={iconColor} aria-hidden />}
      title="Families as child"
      description="The family or families this person was part of as a child—parents and siblings (by birth, adoption, or foster care)."
      descriptionStyle={{ paddingTop: 12, paddingBottom: 9 }}
      isMobile={isMobile}
      contentStyle={{
        padding: 0,
        ...(hasTabs ? { paddingTop: 12 } : {}),
        borderBottomLeftRadius: SECTION_BORDER_RADIUS,
        borderBottomRightRadius: SECTION_BORDER_RADIUS,
      }}
    >
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
          Parents
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
              <PersonNameLink xref={wife.xref} name={wife.name} />
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
              <PersonNameLink xref={husband.xref} name={husband.name} />
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
                const isSubject =
                  c.xref != null &&
                  subjectXref != null &&
                  normalizeXref(c.xref) === normalizeXref(subjectXref);
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
                    <PersonNameLink xref={c.xref} name={c.name} />
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
    </Section>
  );
}
