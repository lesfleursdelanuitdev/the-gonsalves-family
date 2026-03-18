"use client";

import { useState, useEffect } from "react";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { PersonNameLink } from "./PersonNameLink";
import { GenderIcon } from "./GenderIcon";
import { Section } from "./Section";
import {
  familyGridStyle,
  familyGridLabelCellStyle,
  familyGridDataCellStyle,
  familyGridSubHeaderRowStyle,
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
} from "./styles";
import type { FamiliesAsSpouseResponse } from "./types";

const CHILDREN_PAGE_SIZE = 5;

type FamilyAsSpouse = FamiliesAsSpouseResponse["familiesAsSpouse"][number];

interface FamiliesAsSpouseSectionProps {
  familiesAsSpouse: FamilyAsSpouse[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isMobile?: boolean;
}

export function FamiliesAsSpouseSection({
  familiesAsSpouse,
  selectedIndex,
  onSelectIndex,
  isMobile,
}: FamiliesAsSpouseSectionProps) {
  const [childrenPage, setChildrenPage] = useState(0);

  useEffect(() => {
    setChildrenPage(0);
  }, [selectedIndex]);

  if (familiesAsSpouse.length === 0) return null;

  const fam = familiesAsSpouse[selectedIndex] ?? familiesAsSpouse[0]!;
  const hasTabs = familiesAsSpouse.length > 1;
  const topRowBorder = { borderTop: rowBorderBottom };
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
      icon={<Heart size={iconSize} color={iconColor} aria-hidden />}
      title="Families as partner"
      description="This person's adult partnerships and the children from those unions."
      descriptionStyle={{ paddingTop: 12, paddingBottom: 9 }}
      isMobile={isMobile}
      titleStyle={hasTabs ? { paddingBottom: 12 } : undefined}
      contentStyle={{
        padding: 0,
        ...(hasTabs ? { paddingTop: 12 } : {}),
        borderBottomLeftRadius: SECTION_BORDER_RADIUS,
        borderBottomRightRadius: SECTION_BORDER_RADIUS,
      }}
    >
      {hasTabs && (
        <div
          role="tablist"
          aria-label="Family"
          style={{ ...familyNumberTabBarStyle, marginTop: 0, marginBottom: 0, marginLeft: 16, paddingBottom: 12 }}
        >
          {familiesAsSpouse.map((_, idx) => (
            <button
              key={familiesAsSpouse[idx]!.family.id}
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
        <div style={{ ...familyGridLabelCellStyle, ...topRowBorder }}>Partner</div>
        <div
          style={{
            ...familyGridDataCellStyle,
            ...topRowBorder,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <GenderIcon gender={fam.spouse.gender} />
          <PersonNameLink xref={fam.spouse.xref} name={fam.spouse.name} />
        </div>
        <div style={familyGridSubHeaderRowStyle}>
          Children ({totalChildren})
        </div>
        <div style={familyGridChildrenStyle}>
          {pageChildren.length > 0
            ? pageChildren.map((c, idx) => {
                const isLast = idx === pageChildren.length - 1;
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
                    <GenderIcon gender={c.gender} />
                    <span>
                      <PersonNameLink xref={c.xref} name={c.name} />
                      {c.birth?.date ? ` (b. ${c.birth.date})` : ""}
                    </span>
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
