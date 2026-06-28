import Link from "next/link";
import { Calendar, MapPin, User } from "lucide-react";
import { MarkdownNote } from "@/components/shared/MarkdownNote";
import { LivingGatedEventPrompt } from "@/components/events/LivingGatedEventPrompt";
import type { PublicEvent } from "./types";

const TYPE_COLORS: Record<string, string> = {
  BIRT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  DEAT: "bg-stone-100 text-stone-700 dark:bg-stone-800/60 dark:text-stone-300",
  MARR: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  DIV: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  BURI: "bg-stone-200 text-stone-700 dark:bg-stone-700/60 dark:text-stone-300",
  IMMI: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  EMIG: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  CENS: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  RESI: "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300",
  OCCU: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
};

function typeBadgeClass(eventType: string): string {
  return (
    TYPE_COLORS[eventType.toUpperCase()] ??
    "bg-surface-inset text-muted"
  );
}

export function EventCard({ event }: { event: PublicEvent }) {
  return (
    <article className="group min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]">
      <div className="flex items-center gap-3 border-b border-border-subtle/60 bg-surface-2/60 px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold ${typeBadgeClass(event.eventType)}`}
        >
          {event.typeLabel}
        </span>
        {!event.privacyRestricted && event.year ? (
          <span className="ml-auto font-body text-xs font-medium text-muted">{event.year}</span>
        ) : null}
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {event.privacyRestricted && event.loginHref ? (
          <LivingGatedEventPrompt loginHref={event.loginHref} />
        ) : (
          <>
            {event.subjectName ? (
              <div className="flex min-w-0 items-start gap-2">
                <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-link/70" aria-hidden />
                {event.subjectHref ? (
                  <Link href={event.subjectHref} className="min-w-0 break-words font-heading text-base font-semibold text-heading underline-offset-2 hover:underline hover:text-link">
                    {event.subjectName}
                  </Link>
                ) : (
                  <p className="min-w-0 break-words font-heading text-base font-semibold text-heading">
                    {event.subjectName}
                  </p>
                )}
              </div>
            ) : null}

            {event.value ? (
              <MarkdownNote content={event.value} className="text-sm text-heading" />
            ) : null}

            <div className="space-y-1.5">
              {event.dateLabel ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-link/60" aria-hidden />
                  <span>{event.dateLabel}</span>
                </div>
              ) : null}
              {event.placeLabel ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-link/60" aria-hidden />
                  {event.placeHref ? (
                    <Link href={event.placeHref} className="truncate underline-offset-2 hover:underline hover:text-link">
                      {event.placeLabel}
                    </Link>
                  ) : (
                    <span className="truncate">{event.placeLabel}</span>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}

        <Link
          href={event.privacyRestricted && event.loginHref ? event.loginHref : event.profileHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
        >
          {event.privacyRestricted ? "Sign in to view" : "View Event"} <span aria-hidden>&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
