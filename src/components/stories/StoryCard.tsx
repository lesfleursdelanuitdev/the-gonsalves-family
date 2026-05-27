import Link from "next/link";
import { BookOpen, FileText, Scroll } from "lucide-react";
import type { StoryListItem } from "@/lib/stories/story-queries";
import { StoryKind } from "@ligneous/prisma";

function kindMeta(kind: StoryKind): { label: string; href: (slug: string) => string; Icon: typeof BookOpen } {
  if (kind === StoryKind.article || kind === StoryKind.post) {
    return { label: kind === StoryKind.post ? "Post" : "Article", href: (s) => `/culture/articles/${encodeURIComponent(s)}`, Icon: FileText };
  }
  if (kind === StoryKind.folklore) {
    return { label: "Folklore", href: (s) => `/stories/${encodeURIComponent(s)}`, Icon: Scroll };
  }
  return { label: "Story", href: (s) => `/stories/${encodeURIComponent(s)}`, Icon: BookOpen };
}

export function StoryCard({ story }: { story: StoryListItem }) {
  const slug = story.slug ?? story.id;
  const { label, href, Icon } = kindMeta(story.kind);
  const authorName = story.author?.name?.trim() || story.author?.username?.trim() || null;
  const updatedAt = new Date(story.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const tags: string[] = story.tags ?? [];

  return (
    <article className="group flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]">
      <div className="flex min-w-0 flex-1 flex-col space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0 text-link" strokeWidth={1.8} aria-hidden />
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="break-words font-heading text-lg font-semibold leading-tight text-heading">
            {story.title}
          </h3>
          {story.excerpt ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted">{story.excerpt}</p>
          ) : null}
        </div>

        {tags.length > 0 ? (
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full border border-border-subtle/80 bg-surface px-2 py-0.5 text-[0.62rem] font-medium tracking-wide text-muted"
              >
                {tag}
              </span>
            ))}
            {tags.length > 5 ? (
              <span className="inline-block rounded-full border border-border-subtle/80 bg-surface px-2 py-0.5 text-[0.62rem] font-medium tracking-wide text-muted">
                +{tags.length - 5}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-0.5 border-t border-border-subtle/70 pt-3">
          {authorName ? (
            <p className="truncate text-xs text-muted">
              <span className="font-medium text-text">{authorName}</span>
            </p>
          ) : null}
          <p className="text-[0.7rem] text-muted/70">{updatedAt}</p>
        </div>

        <Link
          href={href(slug)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
        >
          Read {label} <span className="text-lg leading-none" aria-hidden>&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
