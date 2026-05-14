import Link from "next/link";
import { StoryBlockRenderer } from "@/components/stories/StoryBlockRenderer";
import { StoryCover } from "@/components/stories/StoryCover";
import { StoryTocNav } from "@/components/stories/StoryTocNav";
import type { StoryPublicPayload } from "@/lib/stories/story-queries";
import { formatPublicAuthorLine, parseStoryBodyMeta } from "@/lib/stories/story-public-meta";
import { resolveStoryHeroUrls } from "@/lib/stories/story-hero-urls";
import { StoryKind } from "@ligneous/prisma";
import { buildToc, flattenDbSectionRows, sectionToBlocks } from "@/lib/stories/story-reader-utils";
import type { StoryFieldKey } from "@/lib/stories/tiptap/field-keys";

export async function StoryArticlePage({ story, urlSlug }: { story: StoryPublicPayload; urlSlug: string }) {
  const hero = await resolveStoryHeroUrls({
    coverMediaId: story.coverMediaId,
    coverMediaKind: story.coverMediaKind,
    profileMediaId: story.profileMediaId,
    profileMediaKind: story.profileMediaKind,
  });

  const meta = parseStoryBodyMeta(story.body);
  const authorDb = story.author?.name?.trim() || story.author?.username?.trim() || null;
  const authorLine = formatPublicAuthorLine(meta, authorDb);
  const authorHref = story.author?.username ? `/people/${encodeURIComponent(story.author.username)}` : null;

  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gonsalves.family").replace(/\/$/, "");
  const pathSlug = story.slug ?? urlSlug;
  const canonicalUrl = `${siteBase}/stories/${encodeURIComponent(pathSlug)}`;

  const storyFieldHtml = (field: StoryFieldKey) => {
    if (field === "title") return story.title;
    if (field === "subtitle") return (story.excerpt ?? "").trim();
    return authorDb ?? "";
  };

  const toc = buildToc(story);
  const flatSections = flattenDbSectionRows(story);
  const showViewerLink = story.kind === StoryKind.story;

  return (
    <>
      <StoryCover
        coverSrc={hero.coverSrc}
        profileSrc={hero.profileSrc}
        title={story.title}
        excerpt={story.excerpt}
        authorLine={authorLine}
        authorHref={authorHref}
        canonicalUrl={canonicalUrl}
      />
      {showViewerLink ? (
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <Link
            href={`/stories/${encodeURIComponent(pathSlug)}/viewer?section=${encodeURIComponent(flatSections[0]?.id ?? "")}`}
            className="inline-flex text-sm font-semibold text-link hover:text-link-hover"
          >
            Read in Story Viewer
          </Link>
        </div>
      ) : null}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,0.35fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text/45">On this page</p>
            <StoryTocNav slug={pathSlug} entries={toc} />
          </div>
        </aside>
        <main className="min-w-0">
          {flatSections.map((sec) => (
            <section key={sec.id} id={`section-${sec.id}`} className="mb-14 scroll-mt-28">
              {!sec.hideTitle ? <h2 className="font-display text-2xl font-semibold text-text">{sec.title}</h2> : null}
              {sec.subtitle && !sec.hideSubtitle ? <p className="mt-2 text-sm uppercase tracking-[0.22em] text-text/55">{sec.subtitle}</p> : null}
              <div className={sec.hideTitle && (!sec.subtitle || sec.hideSubtitle) ? "space-y-6" : "mt-4 space-y-6"}>
                {sectionToBlocks(sec).map((b) => (
                  <StoryBlockRenderer key={b.id} block={b} storyFieldHtml={storyFieldHtml} />
                ))}
              </div>
            </section>
          ))}
        </main>
        <div className="hidden lg:block" />
      </div>
      <StoryTocNav slug={pathSlug} entries={toc} mobileFloating />
    </>
  );
}
