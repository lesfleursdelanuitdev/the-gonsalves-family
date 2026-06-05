import Link from "next/link";
import { StoryShareButton } from "@/components/stories/StoryShareButton";
import type { PublicStoryAuthorCredit } from "@/lib/stories/story-public-meta";

/** Profile route for a linked credit. `personId` is a GedcomIndividual UUID resolved by `/individuals/[id]`. */
function personHref(personId: string): string {
  return `/individuals/${encodeURIComponent(personId)}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0]?.toUpperCase() ?? "") : "";
  return first + last || "?";
}

/** 36px avatar — resolved profile photo when available, neutral sepia monogram otherwise. */
function CreditAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const ring =
    "0 0 0 2px var(--surface-elevated), 0 0 0 3px rgba(180,168,148,0.5), 0 2px 5px rgba(20,14,8,0.22)";
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        aria-hidden
        className="size-9 shrink-0 rounded-full object-cover"
        style={{ boxShadow: ring }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-muted font-display text-[13px] font-semibold leading-none tracking-[0.01em] text-surface-elevated"
      style={{ boxShadow: ring }}
    >
      {initials(name)}
    </span>
  );
}

function CreditText({ credit }: { credit: PublicStoryAuthorCredit }) {
  const linked = Boolean(credit.personId);
  return (
    <span className="flex flex-col gap-px text-left leading-[1.15]">
      {credit.role ? (
        <span className="font-body text-[9.5px] font-bold uppercase tracking-[0.14em] text-text-subtle">
          {credit.role}
        </span>
      ) : null}
      <span
        className={
          linked
            ? "inline-flex items-center whitespace-nowrap border-b border-transparent font-body text-sm font-semibold text-text transition-colors group-hover:border-link/45 group-hover:text-link group-focus-visible:border-link/45 group-focus-visible:text-link"
            : "font-body text-sm font-semibold text-text"
        }
      >
        {credit.name}
        {linked ? (
          <span
            aria-hidden
            className="ml-0.5 -translate-x-0.5 text-[0.78em] text-link opacity-0 transition group-hover:translate-x-0 group-hover:opacity-90 group-focus-visible:translate-x-0 group-focus-visible:opacity-90"
          >
            ↗
          </span>
        ) : null}
      </span>
    </span>
  );
}

/** One credit: avatar + role/name. Linked (whole chip) when `personId` is present. */
function Credit({ credit }: { credit: PublicStoryAuthorCredit }) {
  const body = (
    <>
      <CreditAvatar name={credit.name} avatarUrl={credit.avatarUrl} />
      <CreditText credit={credit} />
    </>
  );
  if (credit.personId) {
    return (
      <Link
        href={personHref(credit.personId)}
        className="group inline-flex w-full items-center gap-2.5 rounded-sm md:w-auto"
      >
        {body}
      </Link>
    );
  }
  return <span className="inline-flex w-full items-center gap-2.5 md:w-auto">{body}</span>;
}

/**
 * Byline masthead strip — full-bleed ruled band below the cover hero. Two rows in
 * one container: role-grouped contributor credits on top (each with an avatar and
 * an optional click-through to the linked family member), a hairline rule, then
 * date · read time · Share beneath. Scales from 1 to many credits (wraps on
 * desktop, stacks on mobile).
 */
export function StoryBylineStrip({
  credits,
  date,
  readTime,
  title,
  excerpt,
  canonicalUrl,
}: {
  credits: PublicStoryAuthorCredit[];
  date?: string | null;
  readTime?: string | null;
  title: string;
  excerpt?: string | null;
  canonicalUrl: string;
}) {
  if (credits.length === 0 && !date && !readTime) return null;

  const meta = [date, readTime].filter(Boolean).join(" · ");

  return (
    <div className="border-y border-border bg-surface">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-3.5 px-4 py-3.5 md:px-10 md:py-[18px]">
        {/* Row 1 — contributors */}
        {credits.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-[30px] gap-y-4">
            {credits.map((credit, i) => (
              <div key={credit.personId ?? `${credit.name}-${i}`} className="contents">
                {/* Divider between credits on a row; hidden before the first item and when stacked on mobile. */}
                {i > 0 ? (
                  <span aria-hidden className="hidden w-px self-stretch bg-border md:block" />
                ) : null}
                <Credit credit={credit} />
              </div>
            ))}
          </div>
        ) : null}

        {/* Rule between the rows (only when both rows are present) */}
        {credits.length > 0 && meta ? <hr className="m-0 border-0 border-t border-border" /> : null}

        {/* Row 2 — date · read time · Share */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          {meta ? <span className="whitespace-nowrap font-body text-[13px] text-text-subtle">{meta}</span> : null}
          <div className="ml-auto">
            <StoryShareButton title={title} text={excerpt} url={canonicalUrl} variant="pill" />
          </div>
        </div>
      </div>
    </div>
  );
}
