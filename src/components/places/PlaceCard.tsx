import Link from "next/link";
import { Baby, Cross, Heart, MapPin } from "lucide-react";
import type { PublicPlace } from "./types";

function Metric({ icon: Icon, label, value }: { icon: typeof Baby; label: string; value: number }) {
  return (
    <div className="min-w-0 px-2 text-center first:pl-0 last:pr-0">
      <Icon className="mx-auto mb-1 h-5 w-5 text-link" strokeWidth={1.8} aria-hidden />
      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-0.5 text-xs font-medium text-heading">{value}</p>
    </div>
  );
}

export function PlaceCard({ place }: { place: PublicPlace }) {
  return (
    <article className="group min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]">
      <div className="flex items-center gap-3 border-b border-border-subtle/60 bg-surface-2/60 px-4 py-3">
        <MapPin className="h-4 w-4 shrink-0 text-link/70" aria-hidden />
        {place.country ? (
          <span className="truncate font-body text-xs font-medium text-muted">{place.country}</span>
        ) : null}
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="break-words font-heading text-lg font-semibold leading-snug text-heading">
            {place.label}
          </h3>
          {place.state ? (
            <p className="mt-0.5 text-sm text-muted">{place.state}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-3 divide-x divide-border-subtle/70 border-y border-border-subtle/70 py-3">
          <Metric icon={Baby} label="Births" value={place.birthCount} />
          <Metric icon={Heart} label="Marriages" value={place.marriageCount} />
          <Metric icon={Cross} label="Deaths" value={place.deathCount} />
        </div>

        <Link
          href={place.profileHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
        >
          View Place <span aria-hidden>&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
