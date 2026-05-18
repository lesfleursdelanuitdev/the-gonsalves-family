import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, MapPin, UsersRound } from "lucide-react";
import { CardOccasionRow } from "@/components/cards/CardOccasionRow";
import type { CardOccasionHighlight } from "@/components/cards/card-occasion";
import type { PublicIndividual } from "./types";
import { PersonCardTreeModalTrigger } from "./PersonCardTreeModal";
import { PersonInlineAvatar } from "./PersonInlineAvatar";

const PERSON_CARD_FALLBACK_BG = "/images/personCardBg.png";

function lifespanLabel(person: PublicIndividual): string {
  const born = person.birthYear ? String(person.birthYear) : "Unknown";
  const died = person.deathYear ? String(person.deathYear) : "Present";
  return `${born} - ${died}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0]?.toUpperCase() ?? "") : "";
  return (first + last) || "?";
}

function metricLabel(value: string | number | null): string {
  if (value == null || value === "") return "Not recorded";
  return String(value);
}

function placesSummary(places: string[]): string {
  if (places.length === 0) return "Not recorded";
  const visible = places.slice(0, 2);
  const remaining = places.length - visible.length;
  return remaining > 0 ? `${visible.join(" · ")} +${remaining}` : visible.join(" · ");
}

export function PersonCard({
  person,
  occasion,
}: {
  person: PublicIndividual;
  /** When set (e.g. upcoming anniversaries), replaces Places / Age / Children metrics. */
  occasion?: CardOccasionHighlight;
}) {
  const compactHeader = Boolean(occasion);

  return (
    <article className="group min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]">
      <div
        className={`relative max-w-full overflow-hidden bg-surface ${compactHeader ? "aspect-[5/3]" : "aspect-[4/5]"}`}
      >
        {person.portraitSrc ? (
          <>
            <Image
              src={person.portraitSrc}
              alt={person.fullName}
              fill
              className="object-cover sepia-[0.2] transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/12 via-black/4 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={PERSON_CARD_FALLBACK_BG}
              alt=""
              fill
              className="object-cover object-center sepia-[0.28] saturate-[0.72] transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(247,241,228,0.06),rgba(64,41,24,0.18)),radial-gradient(circle_at_center,rgba(255,248,232,0.08),rgba(44,30,20,0.18))]" />
            <div
              className={`relative flex aspect-square shrink-0 items-center justify-center rounded-full border border-border-subtle/90 bg-surface-elevated/92 shadow-[0_14px_34px_rgba(40,28,18,0.18),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[2px] ${
                compactHeader ? "w-20 sm:w-24" : "w-28 sm:w-32"
              }`}
            >
              <span
                className={`font-heading font-semibold tracking-[0.04em] text-link ${
                  compactHeader ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl"
                }`}
              >
                {initials(person.fullName)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={`min-w-0 ${compactHeader ? "space-y-2 p-3" : "space-y-4 p-4 sm:p-5"}`}>
        {compactHeader ? (
          <div className="flex min-w-0 items-start gap-2.5">
            <PersonInlineAvatar portraitSrc={person.portraitSrc} fullName={person.fullName} size="lg" />
            <div className="min-w-0 flex-1 space-y-0.5">
              <h3 className="break-words font-heading text-lg font-semibold leading-tight text-heading">
                {person.fullName}
              </h3>
              <p className="text-xs text-muted">{lifespanLabel(person)}</p>
            </div>
          </div>
        ) : (
          <div className="min-w-0 space-y-0.5">
            <h3 className="break-words font-heading text-xl font-semibold leading-tight text-heading">
              {person.fullName}
            </h3>
            <p className="text-sm text-muted">{lifespanLabel(person)}</p>
          </div>
        )}

        {occasion ? (
          <CardOccasionRow occasion={occasion} compact />
        ) : (
          <div className="grid grid-cols-3 divide-x divide-border-subtle/70 border-y border-border-subtle/70 py-3">
            <div className="min-w-0 px-2 first:pl-0">
            <MapPin className="mb-1 h-5 w-5 text-link" strokeWidth={1.8} aria-hidden />
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">Places</p>
            <p className="mt-0.5 truncate text-xs font-medium text-heading" title={person.placeLabels.join(" · ") || undefined}>
              {placesSummary(person.placeLabels)}
            </p>
          </div>
          <div className="min-w-0 px-2 text-center">
            <CalendarCheck className="mx-auto mb-1 h-5 w-5 text-link" strokeWidth={1.8} aria-hidden />
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">Age</p>
            <p className="mt-0.5 text-xs font-medium text-heading">{metricLabel(person.age)}</p>
          </div>
          <div className="min-w-0 px-2 text-center last:pr-0">
            <UsersRound className="mx-auto mb-1 h-5 w-5 text-link" strokeWidth={1.8} aria-hidden />
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">Children</p>
              <p className="mt-0.5 text-xs font-medium text-heading">{person.childrenCount}</p>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-2">
          <Link
            href={`/individuals/${encodeURIComponent(person.id)}`}
            className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
          >
            View Profile <span className="text-lg leading-none" aria-hidden>&rarr;</span>
          </Link>
          <PersonCardTreeModalTrigger personId={person.id} xref={person.xref} fullName={person.fullName} />
        </div>
      </div>
    </article>
  );
}
