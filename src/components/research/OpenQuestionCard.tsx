import Link from "next/link";
import { CalendarDays, HelpCircle, User, UsersRound } from "lucide-react";
import type { PublicOpenQuestion } from "@/lib/research/load-public-open-questions";

const OPEN_QUESTION_CARD_BG = "/images/agedpaperbg.png";

function metricLabel(value: number): string {
  return value === 0 ? "None" : String(value);
}

export function OpenQuestionCard({ question }: { question: PublicOpenQuestion }) {
  const linkedRecords =
    question.individualsCount + question.familiesCount + question.eventsCount + question.mediaCount;
  const coverSrc = question.coverSrc?.trim() || null;

  return (
    <Link
      href={question.href}
      className="group flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]"
    >
      <div className="relative aspect-[4/5] max-w-full overflow-hidden bg-surface">
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={OPEN_QUESTION_CARD_BG}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center sepia-[0.28] saturate-[0.72] transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(247,241,228,0.06),rgba(64,41,24,0.18)),radial-gradient(circle_at_center,rgba(255,248,232,0.08),rgba(44,30,20,0.18))]" />
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="relative flex aspect-square w-28 shrink-0 items-center justify-center rounded-full border border-border-subtle/90 bg-surface-elevated/92 shadow-[0_14px_34px_rgba(40,28,18,0.18),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[2px] sm:w-32">
                <HelpCircle className="h-12 w-12 text-link sm:h-14 sm:w-14" strokeWidth={1.6} aria-hidden />
              </div>
            </div>
          </>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent" />
      </div>

      <div className="min-w-0 space-y-4 p-4 sm:p-5">
        <div className="min-w-0 space-y-2">
          <span className="inline-flex rounded-full border border-link/20 bg-link-soft-bg px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-link">
            Open
          </span>
          <h3 className="line-clamp-4 break-words font-heading text-xl font-semibold leading-snug text-heading group-hover:text-link">
            {question.question}
          </h3>
          <p className="text-sm text-muted">Opened {question.createdAtLabel}</p>
        </div>

        {question.details?.trim() ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">{question.details}</p>
        ) : null}

        <div className="grid grid-cols-3 divide-x divide-border-subtle/70 border-y border-border-subtle/70 py-3">
          <div className="min-w-0 px-2 first:pl-0">
            <User className="mb-1 h-5 w-5 text-link" strokeWidth={1.8} aria-hidden />
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">People</p>
            <p className="mt-0.5 text-xs font-medium text-heading">{metricLabel(question.individualsCount)}</p>
          </div>
          <div className="min-w-0 px-2 text-center">
            <UsersRound className="mx-auto mb-1 h-5 w-5 text-link" strokeWidth={1.8} aria-hidden />
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">Families</p>
            <p className="mt-0.5 text-xs font-medium text-heading">{metricLabel(question.familiesCount)}</p>
          </div>
          <div className="min-w-0 px-2 text-center last:pr-0">
            <CalendarDays className="mx-auto mb-1 h-5 w-5 text-link" strokeWidth={1.8} aria-hidden />
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">Linked</p>
            <p className="mt-0.5 text-xs font-medium text-heading">{metricLabel(linkedRecords)}</p>
          </div>
        </div>

        <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition group-hover:bg-link-soft-bg group-hover:text-link-soft-fg">
          View question
          <span className="text-lg leading-none" aria-hidden>
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  );
}
