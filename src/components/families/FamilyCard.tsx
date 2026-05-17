import Link from "next/link";
import { CalendarHeart, GitBranch, HeartCrack, UsersRound } from "lucide-react";
import { publicFamilyTreeHref } from "@/lib/treeViewerUrl";
import { FamilyPortrait } from "./FamilyPortrait";
import type { DivorcedStatus, PublicFamily } from "./types";

function divorcedLabel(status: DivorcedStatus): string {
  if (status === "yes") return "Yes";
  if (status === "no") return "No";
  return "Unknown";
}

function metricLabel(value: string | number | null): string {
  if (value == null || value === "") return "Not recorded";
  return String(value);
}

export function FamilyCard({ family }: { family: PublicFamily }) {
  const treeViewHref = publicFamilyTreeHref(family);

  return (
    <article className="group min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]">
      <FamilyPortrait partners={family.partners} interactive />

      <div className="min-w-0 space-y-4 p-4 sm:p-5">
        <div className="min-w-0 space-y-1">
          <h3 className="break-words font-heading text-xl font-semibold leading-tight text-heading">{family.title}</h3>
          {family.marriagePlaceLabel ? (
            <p className="text-sm text-muted">{family.marriagePlaceLabel}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-3 divide-x divide-border-subtle/70 border-y border-border-subtle/70 py-3">
          <div className="min-w-0 px-2 first:pl-0">
            <UsersRound className="mb-1 h-5 w-5 text-link" strokeWidth={1.8} aria-hidden />
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">Children</p>
            <p className="mt-0.5 text-xs font-medium text-heading">{family.childrenCount}</p>
          </div>
          <div className="min-w-0 px-2 text-center">
            <CalendarHeart className="mx-auto mb-1 h-5 w-5 text-link" strokeWidth={1.8} aria-hidden />
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">Marriage</p>
            <p className="mt-0.5 truncate text-xs font-medium text-heading" title={family.marriageDateLabel ?? undefined}>
              {metricLabel(family.marriageDateLabel)}
            </p>
          </div>
          <div className="min-w-0 px-2 text-center last:pr-0">
            <HeartCrack className="mx-auto mb-1 h-5 w-5 text-link" strokeWidth={1.8} aria-hidden />
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">Divorced</p>
            <p className="mt-0.5 text-xs font-medium text-heading">{divorcedLabel(family.divorcedStatus)}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Link
            href={family.profileHref}
            className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
          >
            View Family <span aria-hidden>&rarr;</span>
          </Link>
          {treeViewHref ? (
            <Link
              href={treeViewHref}
              className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
              aria-label={`View ${family.title} in tree`}
            >
              <GitBranch className="h-4 w-4 shrink-0" aria-hidden />
              View in tree
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
