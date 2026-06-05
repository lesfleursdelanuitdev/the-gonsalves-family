import Link from "next/link";
import { StoryBlockRenderer } from "@/components/stories/StoryBlockRenderer";
import { StoryCover } from "@/components/stories/StoryCover";
import { StoryBylineStrip } from "@/components/stories/StoryBylineStrip";
import { StorySourcesFootnotes } from "@/components/stories/StorySourcesFootnotes";
import { StoryTocNav } from "@/components/stories/StoryTocNav";
import type { StoryFieldKey } from "@/lib/stories/tiptap/field-keys";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { Footer } from "@/components/homepage";
import type { StoryPublicPayload } from "@/lib/stories/story-queries";
import { parseStoryBodyMeta, publicAuthorCredits } from "@/lib/stories/story-public-meta";
import { resolveCreditAvatars } from "@/lib/stories/story-credit-avatars";
import { articleCoverSrc, resolveStoryHeroUrls } from "@/lib/stories/story-hero-urls";
import { StoryKind } from "@ligneous/prisma";
import { buildToc, filterLeadingArticleDuplicateBlocks, flattenDbSectionRows, sectionToBlocks } from "@/lib/stories/story-reader-utils";

/** Title/subtitle/author already render in the cover header, so drop their inline chips from the body. */
const ARTICLE_SUPPRESSED_FIELDS: StoryFieldKey[] = ["title", "subtitle", "author"];

export async function StoryArticlePage({ story, urlSlug }: { story: StoryPublicPayload; urlSlug: string }) {
  const hero = await resolveStoryHeroUrls({
    coverMediaId: story.coverMediaId,
    coverMediaKind: story.coverMediaKind,
    profileMediaId: story.profileMediaId,
    profileMediaKind: story.profileMediaKind,
  });

  const meta = parseStoryBodyMeta(story.body);
  const authorDb = story.author?.name?.trim() || story.author?.username?.trim() || null;
  const credits = await resolveCreditAvatars(publicAuthorCredits(meta, authorDb));

  const publishDate = story.publishedAt ?? story.createdAt;
  const dateLabel = publishDate
    ? new Date(publishDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gonsalves.family").replace(/\/$/, "");
  const pathSlug = story.slug ?? urlSlug;
  const canonicalUrl = `${siteBase}/culture/articles/${encodeURIComponent(pathSlug)}`;

  const storyFields = {
    title: story.title,
    subtitle: (story.excerpt ?? "").trim(),
    author: authorDb ?? "",
  };

  const toc = buildToc(story);
  const flatSections = flattenDbSectionRows(story);
  const showViewerLink = story.kind === StoryKind.story;

  const authorNames = [
    ...meta.authors.map((a) => a.name.trim()).filter(Boolean),
    ...(authorDb ? [authorDb] : []),
  ];
  const articleBodySuppress = { title: story.title, authorNames };

  return (
    <>
      <Navbar />
      <StoryCover
        coverSrc={articleCoverSrc(hero.coverSrc, hero.profileSrc)}
        title={story.title}
        excerpt={story.excerpt}
        authorLine={null}
        canonicalUrl={canonicalUrl}
        showShare={false}
      />
      <StoryBylineStrip
        credits={credits}
        date={dateLabel}
        title={story.title}
        excerpt={story.excerpt}
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
      <div className="mx-auto flex max-w-[1080px] items-start gap-10 px-4 py-10 md:px-10">
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text/45">On this page</p>
            <StoryTocNav slug={pathSlug} entries={toc} />
          </div>
        </aside>
        <main className="article-prose min-w-0 flex-1 rounded-2xl border border-border bg-surface-elevated px-7 py-9 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_12px_34px_rgba(20,14,8,0.07),0_2px_8px_rgba(20,14,8,0.04)] md:max-w-[748px] md:px-16 md:pb-14 md:pt-14">
          {flatSections.map((sec) => (
            <section key={sec.id} id={`section-${sec.id}`} className="mb-14 scroll-mt-28">
              {!sec.hideTitle ? <h2 className="font-display text-2xl font-semibold text-text">{sec.title}</h2> : null}
              {sec.subtitle && !sec.hideSubtitle ? <p className="mt-2 text-sm uppercase tracking-[0.22em] text-text/55">{sec.subtitle}</p> : null}
              <div className={sec.hideTitle && (!sec.subtitle || sec.hideSubtitle) ? "space-y-6" : "mt-4 space-y-6"}>
                {filterLeadingArticleDuplicateBlocks(sectionToBlocks(sec), articleBodySuppress).map((b) => (
                  <StoryBlockRenderer
                    key={b.id}
                    block={b}
                    storyFields={storyFields}
                    suppressStoryFields={ARTICLE_SUPPRESSED_FIELDS}
                  />
                ))}
              </div>
            </section>
          ))}
          <StorySourcesFootnotes sources={story.storySources} />
        </main>
      </div>
      <StoryTocNav slug={pathSlug} entries={toc} mobileFloating />
      <Footer />
    </>
  );
}
