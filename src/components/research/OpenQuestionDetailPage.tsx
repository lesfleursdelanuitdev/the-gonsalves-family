import Link from "next/link";
import {
  BookMarked,
  CalendarDays,
  FileText,
  Images,
  User,
  UsersRound,
} from "lucide-react";
import type {
  PublicOpenQuestionDetail,
  PublicOpenQuestionLink,
} from "@/lib/research/load-public-open-questions";
import { ResearchPageShell } from "@/components/research/ResearchPageShell";

function linkIcon(kind: PublicOpenQuestionLink["kind"]) {
  switch (kind) {
    case "individual":
      return User;
    case "family":
      return UsersRound;
    case "event":
      return CalendarDays;
    case "media":
      return Images;
    case "source":
      return BookMarked;
    case "note":
      return FileText;
  }
}

function linkSectionTitle(kind: PublicOpenQuestionLink["kind"]): string {
  switch (kind) {
    case "individual":
      return "People";
    case "family":
      return "Families";
    case "event":
      return "Events";
    case "media":
      return "Media";
    case "source":
      return "Sources";
    case "note":
      return "Notes";
  }
}

const LINK_SECTION_ORDER: PublicOpenQuestionLink["kind"][] = [
  "individual",
  "family",
  "event",
  "media",
  "source",
  "note",
];

function groupedLinks(links: PublicOpenQuestionLink[]): Map<PublicOpenQuestionLink["kind"], PublicOpenQuestionLink[]> {
  const groups = new Map<PublicOpenQuestionLink["kind"], PublicOpenQuestionLink[]>();
  for (const link of links) {
    const bucket = groups.get(link.kind) ?? [];
    bucket.push(link);
    groups.set(link.kind, bucket);
  }
  return groups;
}

function resolveInlineMedia(question: PublicOpenQuestionDetail): {
  coverSrc: string | null;
  href: string | null;
  label: string | null;
} {
  const mediaLinks = question.links.filter(
    (link): link is Extract<PublicOpenQuestionLink, { kind: "media" }> => link.kind === "media",
  );
  const featured =
    mediaLinks.find((link) => Boolean(link.coverSrc) && !link.privacyRestricted) ?? mediaLinks[0] ?? null;
  const coverSrc = question.coverSrc?.trim() || featured?.coverSrc?.trim() || null;

  return {
    coverSrc,
    href: featured?.href ?? null,
    label: featured?.label ?? null,
  };
}

function QuestionBody({
  details,
  coverSrc,
  mediaHref,
  mediaLabel,
}: {
  details: string | null;
  coverSrc: string | null;
  mediaHref: string | null;
  mediaLabel: string | null;
}) {
  const figure = coverSrc ? (
    <figure className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-xl border border-border-subtle/80 bg-surface shadow-[0_8px_20px_rgba(40,28,18,0.1)] sm:float-right sm:mb-3 sm:ml-5 sm:w-72 sm:max-w-[42%] lg:w-80">
      {mediaHref ? (
        <Link href={mediaHref} className="block h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc}
            alt={mediaLabel ?? ""}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
          />
        </Link>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverSrc} alt={mediaLabel ?? ""} className="absolute inset-0 h-full w-full object-cover" />
      )}
    </figure>
  ) : null;

  return (
    <div className="flow-root rounded-2xl border border-border/80 bg-surface-elevated/80 p-5 shadow-[0_8px_24px_rgba(60,45,25,0.06)]">
      <span className="mb-4 inline-flex rounded-full border border-link/20 bg-link-soft-bg px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-link">
        Open
      </span>

      {figure}

      {details?.trim() ? (
        <p className="whitespace-pre-line text-base leading-relaxed text-muted">{details}</p>
      ) : (
        <p className="text-sm text-muted">No additional details have been recorded for this question yet.</p>
      )}
    </div>
  );
}

function LinkRow({ link }: { link: PublicOpenQuestionLink }) {
  const Icon = linkIcon(link.kind);
  return (
    <li>
      <Link
        href={link.href}
        className="group flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle/80 bg-surface-elevated/80 px-4 py-3 transition hover:border-link/25 hover:bg-link-soft-bg/40"
      >
        {link.kind === "media" && link.coverSrc ? (
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border-subtle/80 bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={link.coverSrc} alt="" className="h-full w-full object-cover" />
          </span>
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-link/15 bg-link-soft-bg text-link">
            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block break-words font-heading text-base font-semibold leading-snug text-heading group-hover:text-link">
            {link.label}
          </span>
          {link.kind === "media" && link.privacyRestricted ? (
            <span className="mt-1 block text-xs text-muted">Sign in to view this media item.</span>
          ) : null}
          {link.kind === "note" && link.privacyRestricted ? (
            <span className="mt-1 block text-xs text-muted">Sign in to view this note.</span>
          ) : null}
          {link.kind === "event" && link.privacyRestricted ? (
            <span className="mt-1 block text-xs text-muted">Sign in to view this event.</span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

export function OpenQuestionDetailPage({ question }: { question: PublicOpenQuestionDetail }) {
  const groups = groupedLinks(question.links);
  const inlineMedia = resolveInlineMedia(question);

  return (
    <ResearchPageShell
      title={question.question}
      description={`Opened ${question.createdAtLabel}. Unresolved research item in the published family tree.`}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Research", href: "/research" },
        { label: "Open questions", href: "/research/open-questions" },
        { label: "Question" },
      ]}
    >
      <div className="space-y-8">
        <QuestionBody
          details={question.details}
          coverSrc={inlineMedia.coverSrc}
          mediaHref={inlineMedia.href}
          mediaLabel={inlineMedia.label}
        />

        {LINK_SECTION_ORDER.map((kind) => {
          const items = groups.get(kind);
          if (!items?.length) return null;
          return (
            <section key={kind} className="space-y-3">
              <div>
                <p className="section-subtitle">Linked {linkSectionTitle(kind).toLowerCase()}</p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-heading">{linkSectionTitle(kind)}</h2>
                <div className="mt-3 h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />
              </div>
              <ul className="space-y-3">
                {items.map((link) => (
                  <LinkRow key={`${link.kind}-${link.id}`} link={link} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </ResearchPageShell>
  );
}
