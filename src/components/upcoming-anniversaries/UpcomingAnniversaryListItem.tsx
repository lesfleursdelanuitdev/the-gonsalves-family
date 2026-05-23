import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PersonInlineAvatar } from "@/components/individuals/PersonInlineAvatar";
import type { UpcomingAnniversaryItem } from "@/lib/upcoming-anniversaries/group-upcoming-anniversaries";

const EVENT_TYPE_LABEL: Record<string, string> = {
  BIRT: "Birthday",
  DEAT: "Deathday",
  MARR: "Anniversary",
};

// Fallback subtitles produced when the event year is unknown — redundant with the event label in list view
const NO_YEAR_SUBTITLES = new Set(["Birthday", "Day of remembrance", "Wedding anniversary"]);

export function UpcomingAnniversaryListItem({ item }: { item: UpcomingAnniversaryItem }) {
  const eventLabel = EVENT_TYPE_LABEL[item.eventType] ?? item.occasionTitle;
  const yearsText = NO_YEAR_SUBTITLES.has(item.occasionSubtitle) ? null : item.occasionSubtitle || null;

  const href =
    item.kind === "person"
      ? `/individuals/${encodeURIComponent(item.person.id)}`
      : item.family.profileHref;

  return (
    <div className="flex min-w-0 items-center gap-3 py-2.5">
      <div className="w-16 shrink-0 text-right text-xs font-bold tabular-nums text-link sm:w-20 sm:text-sm">
        {item.calendarDayLabel}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center gap-2">
          {item.kind === "person" ? (
            <>
              <PersonInlineAvatar
                portraitSrc={item.person.portraitSrc}
                fullName={item.person.fullName}
                size="sm"
              />
              <span className="min-w-0 truncate text-sm font-bold text-heading">
                {item.person.fullName}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center">
                {item.family.partners.slice(0, 2).map((p, i) => (
                  <div key={p.id} className={i > 0 ? "-ml-2" : ""}>
                    <PersonInlineAvatar
                      portraitSrc={p.portraitSrc}
                      fullName={p.fullName}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
              <span className="min-w-0 truncate text-sm font-bold text-heading">
                {item.family.title}
              </span>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">
          {eventLabel}
          {yearsText ? ` · ${yearsText}` : ""}
        </p>
      </div>

      <Link
        href={href}
        className="shrink-0 rounded p-1 text-muted/60 transition hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        aria-label="View profile"
      >
        <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
  );
}
