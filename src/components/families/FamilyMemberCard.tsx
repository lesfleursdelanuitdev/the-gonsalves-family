"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { ChartTypeModal } from "@/components/TreeViewer/v2/ChartHeader/ChartMenu/ChartTypeModal";
import {
  ancestorChartHref,
  childDescendancyHref,
  type AncestorChartStrategy,
} from "@/lib/treeViewerUrl";
import { getNameBackgroundColor } from "@/lib/person-name-accent";
import { cn } from "@/lib/utils";
import type { PublicFamilyMember, PublicFamilyPartner } from "./types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0]?.toUpperCase() ?? "") : "";
  return (first + last) || "?";
}

function memberBorderColor(member: PublicFamilyMember, partners: PublicFamilyPartner[]): string {
  if (member.role === "Partner") {
    const partner = partners.find((p) => p.id === member.id);
    return getNameBackgroundColor(partner?.sex ?? partner?.gender ?? member.sex ?? member.gender);
  }
  return getNameBackgroundColor(member.sex ?? member.gender);
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  const text = String(value);
  return (
    <div className="min-w-0 rounded-lg border border-border-subtle/60 bg-surface/80 px-3 py-2.5">
      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-heading tabular-nums" title={text}>
        {text}
      </p>
    </div>
  );
}

const actionLinkClass =
  "inline-flex w-full items-center justify-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg";

export interface FamilyMemberCardProps {
  member: PublicFamilyMember;
  partners: PublicFamilyPartner[];
  /** Partners: show View Ancestors with chart picker. */
  showAncestorsAction?: boolean;
  /** Children: link to descendancy chart with all root partners revealed. */
  showDescendancyChartAction?: boolean;
  /** Flat presentation without card/avatar drop shadows (mobile family profile). */
  flat?: boolean;
}

export function FamilyMemberCard({
  member,
  partners,
  showAncestorsAction = false,
  showDescendancyChartAction = false,
  flat = false,
}: FamilyMemberCardProps) {
  const router = useRouter();
  const [pedigreePickerOpen, setPedigreePickerOpen] = useState(false);
  const borderColor = memberBorderColor(member, partners);
  const born = member.birthDateLabel ?? "Not recorded";
  const died = member.deathYear != null ? (member.deathDateLabel ?? "Recorded") : "Living";

  const onPedigreeChartSelect = (chart: ChartViewStrategyName) => {
    const strategy = chart as AncestorChartStrategy;
    router.push(
      ancestorChartHref({
        rootXref: member.xref,
        chartStrategy: strategy,
        rootName: member.fullName,
      })
    );
  };

  return (
    <>
      <article
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-border-subtle/80 bg-surface-elevated/80 p-4",
          !flat && "shadow-[0_4px_14px_rgba(40,28,18,0.06)]",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 p-0.5">
            <div
              className={cn(
                "relative h-12 w-12 overflow-hidden rounded-full border-[3px] bg-surface",
                !flat && "shadow-[0_6px_16px_rgba(40,28,18,0.14)]",
              )}
              style={{ borderColor }}
            >
              {member.portraitSrc ? (
                <Image
                  src={member.portraitSrc}
                  alt={member.fullName}
                  fill
                  className="object-cover sepia-[0.2]"
                  sizes="48px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-heading text-sm font-semibold text-link">
                  {initials(member.fullName)}
                </span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-crimson">{member.role}</p>
            <h3 className="mt-0.5 truncate font-heading text-lg font-semibold text-heading" title={member.fullName}>
              {member.fullName}
            </h3>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <StatCell label="Born" value={born} />
            <StatCell label="Died" value={died} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatCell label="Partner(s)" value={member.partnersCount} />
            <StatCell label="Children" value={member.childrenCount} />
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col gap-2",
            (showAncestorsAction || showDescendancyChartAction) && "sm:grid sm:grid-cols-2 sm:gap-2",
          )}
        >
          <Link href={member.profileHref} className={actionLinkClass}>
            View Profile <span aria-hidden>&rarr;</span>
          </Link>
          {showDescendancyChartAction ? (
            <Link
              href={childDescendancyHref({ rootXref: member.xref, rootName: member.fullName })}
              className={actionLinkClass}
            >
              View Descendancy Chart <span aria-hidden>&rarr;</span>
            </Link>
          ) : null}
          {showAncestorsAction ? (
            <button type="button" onClick={() => setPedigreePickerOpen(true)} className={actionLinkClass}>
              View Ancestors <span aria-hidden>&rarr;</span>
            </button>
          ) : null}
        </div>
      </article>

      {showAncestorsAction ? (
        <ChartTypeModal
          open={pedigreePickerOpen}
          value="pedigree"
          mode="ancestor"
          title={`Ancestors for ${member.fullName}`}
          onClose={() => setPedigreePickerOpen(false)}
          onSelect={onPedigreeChartSelect}
        />
      ) : null}
    </>
  );
}
