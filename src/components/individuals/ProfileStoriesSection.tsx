import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { PublicIndividualStory } from "./types";

export function ProfileStoriesSection({ stories }: { stories: PublicIndividualStory[] }) {
  if (stories.length === 0) return null;

  return (
    <section
      id="stories"
      className="scroll-mt-28 mt-6 rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-[0_20px_52px_rgba(40,28,18,0.15)] sm:p-6 md:shadow-[0_10px_26px_rgba(60,45,25,0.08)]"
    >
      <div className="mb-5 flex items-start gap-3 border-b border-border-subtle pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-link/20 bg-link-soft-bg text-link">
          <BookOpen className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Stories</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold text-heading">Linked Stories</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Family stories, articles, and folklore that mention or feature this person.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {stories.map((story) => (
          <Link
            key={story.id}
            href={story.href}
            className="group flex min-w-0 items-start gap-3 rounded-xl border border-border-subtle/80 bg-surface-elevated/80 p-3 transition hover:-translate-y-0.5 hover:border-link/30 hover:shadow-[0_12px_24px_rgba(60,45,25,0.1)]"
          >
            {story.coverUrl ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-surface-inset">
                <Image
                  src={story.coverUrl}
                  alt=""
                  fill
                  className="object-cover sepia-[0.15]"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-link-soft-bg text-link">
                <BookOpen className="h-6 w-6" aria-hidden />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-link/20 bg-link-soft-bg px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-link">
                  {story.kindLabel}
                </span>
                <span className="text-xs text-muted">{story.updatedAtLabel}</span>
              </div>
              <p className="mt-1 truncate font-heading text-base font-semibold text-heading group-hover:text-link">
                {story.title}
              </p>
              {story.excerpt ? (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{story.excerpt}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
