import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { StoryKind } from "@ligneous/prisma";
import { StoryViewerShell } from "@/components/stories/StoryViewerShell";
import { fetchPublishedStoryBySlug } from "@/lib/stories/story-queries";
import { parseStoryBodyMeta, publicAuthorCredits } from "@/lib/stories/story-public-meta";
import { resolveStoryHeroUrls } from "@/lib/stories/story-hero-urls";
import { buildViewerPages, buildViewerToc } from "@/lib/stories/story-viewer-utils";

const STORY_KINDS = new Set<StoryKind>([StoryKind.story, StoryKind.folklore]);
const ARTICLE_KINDS = new Set<StoryKind>([StoryKind.article, StoryKind.post]);

export default async function StoryPublicPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  let story;
  try {
    story = await fetchPublishedStoryBySlug(slug);
  } catch {
    throw new Error("Story routes require PUBLIC_STORY_TREE_ID to be configured.");
  }
  if (!story) notFound();

  if (ARTICLE_KINDS.has(story.kind)) {
    redirect(`/culture/articles/${encodeURIComponent(story.slug ?? slug)}`);
  }

  if (!STORY_KINDS.has(story.kind)) {
    redirect(`/`);
  }

  const [hero, meta] = await Promise.all([
    resolveStoryHeroUrls({
      coverMediaId: story.coverMediaId,
      coverMediaKind: story.coverMediaKind,
      profileMediaId: story.profileMediaId,
      profileMediaKind: story.profileMediaKind,
    }),
    Promise.resolve(parseStoryBodyMeta(story.body)),
  ]);

  const authorDb = story.author?.name?.trim() || story.author?.username?.trim() || null;

  const pages = buildViewerPages(story);
  const toc = buildViewerToc(pages);

  const pathSlug = story.slug ?? slug;

  const coverMeta = {
    collection: story.title,
    catalog: pathSlug.toUpperCase(),
    subtitle: story.excerpt ?? null,
    edition: null,
    pages: null,
    coverSrc: hero.coverSrc,
    coverCaption: null,
    credits: publicAuthorCredits(meta, authorDb),
  };

  const storyFields = {
    title: story.title,
    subtitle: (story.excerpt ?? "").trim(),
    author: authorDb ?? "",
  };

  return (
    <Suspense>
      <StoryViewerShell
        slug={pathSlug}
        pages={pages}
        toc={toc}
        meta={coverMeta}
        fields={storyFields}
      />
    </Suspense>
  );
}
