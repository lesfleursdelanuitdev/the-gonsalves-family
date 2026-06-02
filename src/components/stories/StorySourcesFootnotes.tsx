import type { StoryPublicPayload } from "@/lib/stories/story-queries";
import { stripSlashesFromName } from "@/lib/surnames/surname-query";

type StorySourceRow = StoryPublicPayload["storySources"][number];

/** Build a footnote-style citation line from the available GEDCOM source fields. */
function formatSourceCitation(row: StorySourceRow): { title: string | null; rest: string[] } {
  const src = row.source;
  const author = stripSlashesFromName(src.author).trim();
  const realTitle = src.title?.trim() || src.abbreviation?.trim() || "";

  // Lead with the work title; fall back to the author when there is no title.
  const title = realTitle || author || null;

  // Trailing parts in citation order. Author only goes here if the title slot used a real title.
  const rest = [
    realTitle ? author : "",
    src.publication?.trim() ?? "",
    src.callNumber?.trim() ? `Ref. ${src.callNumber.trim()}` : "",
    row.notes?.trim() ?? "",
  ].filter((p): p is string => p.length > 0);

  return { title, rest };
}

export function StorySourcesFootnotes({ sources }: { sources: StoryPublicPayload["storySources"] }) {
  const rows = (sources ?? []).filter((row) => {
    const c = formatSourceCitation(row);
    return c.title || c.rest.length > 0;
  });
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="story-sources-heading" className="mt-16 border-t border-border/60 pt-6">
      <h2
        id="story-sources-heading"
        className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-text/55"
      >
        Sources
      </h2>
      <ol className="space-y-2 text-sm leading-relaxed text-text/70">
        {rows.map((row, i) => {
          const { title, rest } = formatSourceCitation(row);
          return (
            <li key={row.id} className="flex gap-2">
              <span className="shrink-0 tabular-nums text-text/45">{i + 1}.</span>
              <span className="min-w-0">
                {title ? <cite className="not-italic font-medium text-text/80">{title}</cite> : null}
                {title && rest.length > 0 ? <span className="text-text/45">{" — "}</span> : null}
                {rest.join(". ")}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
