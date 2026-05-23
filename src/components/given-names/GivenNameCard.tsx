import Link from "next/link";
import { FileSignature, TrendingDown, TrendingUp, UsersRound } from "lucide-react";
import type { GivenNameRankTier } from "@/lib/given-names/given-name-list-helpers";
import type { PublicGivenName } from "./types";

export function GivenNameCard({
  givenName,
  rankTier,
}: {
  givenName: PublicGivenName;
  rankTier?: GivenNameRankTier | null;
}) {
  return (
    <article className="group min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]">
      <div className="relative flex min-h-[7.5rem] items-center justify-center border-b border-border-subtle/70 bg-gradient-to-br from-surface via-surface-elevated to-link-soft-bg/40 px-4 py-8">
        {rankTier === "top10" ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-[#c9a227]/50 bg-[#f5edd4] px-2 py-0.5 font-body text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[#6b4e0a] shadow-sm">
            <TrendingUp className="h-3 w-3" aria-hidden />
            Top 10
          </span>
        ) : null}
        {rankTier === "bottom10" ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface px-2 py-0.5 font-body text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted shadow-sm">
            <TrendingDown className="h-3 w-3" aria-hidden />
            Bottom 10
          </span>
        ) : null}
        <div className="text-center">
          <FileSignature className="mx-auto mb-2 h-10 w-10 text-link" strokeWidth={1.6} aria-hidden />
          <p className="font-heading text-2xl font-semibold leading-tight text-heading">{givenName.displayGivenName}</p>
        </div>
      </div>

      <div className="min-w-0 space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-center gap-2 border-y border-border-subtle/70 py-3">
          <UsersRound className="h-5 w-5 text-link" strokeWidth={1.8} aria-hidden />
          <div className="text-center">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">In tree</p>
            <p className="mt-0.5 text-sm font-medium text-heading">{givenName.peopleCount.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Link
            href={givenName.individualsHref}
            className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
          >
            Browse people with this given name <span aria-hidden>&rarr;</span>
          </Link>
          <Link
            href={givenName.profileHref}
            className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
          >
            About this given name
          </Link>
        </div>
      </div>
    </article>
  );
}
