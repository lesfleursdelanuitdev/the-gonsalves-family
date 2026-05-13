"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Home } from "lucide-react";
import { useState } from "react";
import type { PublicIndividualFamilyGroup, PublicIndividualRelation } from "./types";

type FamilyTab = "origin" | "descendants";

function lifeLabel(birthYear: number | null, deathYear: number | null): string {
  if (!birthYear && !deathYear) return "Dates not recorded";
  return `${birthYear ? String(birthYear) : "Unknown"} - ${deathYear ? String(deathYear) : "Present"}`;
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function MiniPortrait({ relation }: { relation: PublicIndividualRelation }) {
  return (
    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border-subtle/80 bg-surface">
      {relation.portraitSrc ? (
        <Image src={relation.portraitSrc} alt="" fill className="object-cover sepia-[0.18]" sizes="48px" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,rgba(129,89,58,0.12),rgba(129,89,58,0.05))] font-heading text-base font-semibold tracking-[0.04em] text-link/80">
          {initials(relation.fullName)}
        </span>
      )}
    </span>
  );
}

function RelationList({
  title,
  items = [],
  empty,
  maxVisible,
  pageSize,
}: {
  title: string;
  items?: PublicIndividualRelation[];
  empty: string;
  maxVisible?: number;
  pageSize?: number;
}) {
  const profilePersonIndex = items.findIndex((item) => item.relationship === "Profile person");
  const defaultPage = pageSize && profilePersonIndex >= 0 ? Math.floor(profilePersonIndex / pageSize) + 1 : 1;
  const [page, setPage] = useState(defaultPage);
  const totalPages = pageSize ? Math.max(1, Math.ceil(items.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const pagedItems = pageSize ? items.slice((safePage - 1) * pageSize, safePage * pageSize) : items;
  const visibleItems = maxVisible ? pagedItems.slice(0, maxVisible) : pagedItems;
  const remainingCount = maxVisible ? Math.max(0, items.length - visibleItems.length) : 0;

  return (
    <section className="min-w-0 rounded-xl border border-border-subtle/70 bg-surface/75">
      <div className="border-b border-border-subtle px-4 py-3">
        <h3 className="font-heading text-lg font-semibold text-heading">{title}</h3>
      </div>
      <div className="divide-y divide-border-subtle/70">
        {items.length > 0 ? (
          <>
            {visibleItems.map((relation) => {
              const isProfilePerson = relation.relationship === "Profile person";
              return (
                <Link
                  key={`${title}-${relation.id}`}
                  href={`/individuals/${encodeURIComponent(relation.id)}`}
                  className={`group flex min-w-0 items-center gap-3 px-4 py-3 transition hover:bg-link-soft-bg/60 ${
                    isProfilePerson
                      ? "m-2 rounded-xl border border-[#c8a24a]/80 bg-[rgba(201,162,74,0.12)] shadow-[0_8px_20px_rgba(201,162,74,0.14)]"
                      : "border border-transparent"
                  }`}
                >
                  <MiniPortrait relation={relation} />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-heading text-base font-semibold leading-snug text-heading group-hover:text-link">
                      {relation.fullName}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      {relation.relationship}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{lifeLabel(relation.birthYear, relation.deathYear)}</span>
                  </span>
                </Link>
              );
            })}
            {remainingCount > 0 ? (
              <div className="px-4 py-3">
                <span className="inline-flex rounded-full border border-border-subtle bg-bg/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-link">
                  +{remainingCount}
                </span>
              </div>
            ) : null}
            {pageSize && totalPages > 1 ? (
              <nav aria-label={`${title} pagination`} className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={safePage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                  Previous
                </button>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={safePage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </nav>
            ) : null}
          </>
        ) : (
          <p className="px-4 py-6 text-sm leading-relaxed text-muted">{empty}</p>
        )}
      </div>
    </section>
  );
}

function FamilyGroupCard({
  title,
  family,
  kind,
}: {
  title: string;
  family: PublicIndividualFamilyGroup;
  kind: "origin" | "partner";
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-border/80 bg-surface-elevated/90 p-4 shadow-[0_8px_24px_rgba(60,45,25,0.06)]">
      <div className="mb-4 flex flex-col gap-2 border-b border-border-subtle pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-xl font-semibold text-heading">{title}</h3>
          {family.xref ? (
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{family.xref}</p>
          ) : null}
          {kind === "origin" && family.pedigreeLabel ? (
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-link">{family.pedigreeLabel}</p>
          ) : null}
        </div>
        <p className="w-fit rounded-full border border-border-subtle bg-bg/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-link">
          {family.childrenCount} {family.childrenCount === 1 ? "child" : "children"}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {kind === "origin" ? (
          <>
            <RelationList title="Parents" items={family.parents} empty="No parents are recorded for this family." />
            <RelationList title="Children in this family" items={family.children} empty="No children are recorded for this family." pageSize={5} />
          </>
        ) : (
          <>
            <RelationList title="Partners" items={family.partners} empty="No partners are recorded for this family." maxVisible={2} />
            <RelationList title="Children" items={family.children} empty="No children are recorded for this family." pageSize={5} />
          </>
        )}
      </div>
    </article>
  );
}

export function FamilyRelationsTabs({
  parents = [],
  siblings = [],
  partners = [],
  childRelations = [],
  familiesAsChild = [],
  familiesAsPartner = [],
}: {
  parents?: PublicIndividualRelation[];
  siblings?: PublicIndividualRelation[];
  partners?: PublicIndividualRelation[];
  childRelations?: PublicIndividualRelation[];
  familiesAsChild?: PublicIndividualFamilyGroup[];
  familiesAsPartner?: PublicIndividualFamilyGroup[];
}) {
  const [tab, setTab] = useState<FamilyTab>("origin");

  return (
    <div className="mt-5 min-w-0">
      <div className="mb-4 grid gap-2 rounded-xl border border-border-subtle bg-bg/60 p-1 sm:inline-grid sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setTab("origin")}
          aria-pressed={tab === "origin"}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
            tab === "origin"
              ? "bg-link text-primary-foreground shadow-[0_6px_16px_rgba(31,90,56,0.18)]"
              : "text-link hover:bg-link-soft-bg hover:text-link-soft-fg"
          }`}
        >
          <Home className="h-4 w-4" aria-hidden />
          Parents &amp; Siblings
        </button>
        <button
          type="button"
          onClick={() => setTab("descendants")}
          aria-pressed={tab === "descendants"}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
            tab === "descendants"
              ? "bg-link text-primary-foreground shadow-[0_6px_16px_rgba(31,90,56,0.18)]"
              : "text-link hover:bg-link-soft-bg hover:text-link-soft-fg"
          }`}
        >
          <Heart className="h-4 w-4" aria-hidden />
          Partners &amp; Children
        </button>
      </div>

      {tab === "origin" ? (
        familiesAsChild.length > 0 ? (
          <div className="grid gap-4">
            {familiesAsChild.map((family, index) => (
              <FamilyGroupCard key={family.id} title={`Family as child ${index + 1}`} family={family} kind="origin" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <RelationList title="Parents" items={parents} empty="No parents are recorded for this person." />
            <RelationList title="Siblings" items={siblings} empty="No siblings are recorded for this person." />
          </div>
        )
      ) : (
        familiesAsPartner.length > 0 ? (
          <div className="grid gap-4">
            {familiesAsPartner.map((family, index) => (
              <FamilyGroupCard key={family.id} title={`Partner family ${index + 1}`} family={family} kind="partner" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <RelationList title="Partners" items={partners} empty="No partners are recorded for this person." maxVisible={2} />
            <RelationList title="Children" items={childRelations} empty="No children are recorded for this person." pageSize={5} />
          </div>
        )
      )}
    </div>
  );
}
