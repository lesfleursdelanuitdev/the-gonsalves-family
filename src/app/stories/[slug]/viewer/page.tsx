import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { StoryViewerClient } from "@/components/stories/StoryViewerClient";
import { fetchPublishedStoryBySlug } from "@/lib/stories/story-queries";
import { formatPublicAuthorLine, parseStoryBodyMeta } from "@/lib/stories/story-public-meta";
import { resolveStoryHeroUrls } from "@/lib/stories/story-hero-urls";
import { StoryKind } from "@ligneous/prisma";
import { extractTimelineBlocks, flattenDbSectionRows } from "@/lib/stories/story-reader-utils";
import type { StoryFieldKey } from "@/lib/stories/tiptap/field-keys";

export default async function StoryViewerPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  let story;
  try {
    story = await fetchPublishedStoryBySlug(slug);
  } catch {
    throw new Error("Story routes require PUBLIC_STORY_TREE_ID to be configured.");
  }
  if (!story) notFound();
  if (story.kind !== StoryKind.story) {
    redirect(`/stories/${encodeURIComponent(story.slug ?? slug)}`);
  }

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
  const pathSlug = story.slug ?? slug;
  const canonicalUrl = `${siteBase}/stories/${encodeURIComponent(pathSlug)}/viewer`;

  const storyFieldHtml = (field: StoryFieldKey) => {
    if (field === "title") return story.title;
    if (field === "subtitle") return (story.excerpt ?? "").trim();
    return authorDb ?? "";
  };

  const sections = flattenDbSectionRows(story);
  const timelineBlocks = extractTimelineBlocks(story);

  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />
      <StoryViewerClient
        slug={pathSlug}
        title={story.title}
        excerpt={story.excerpt}
        coverSrc={hero.coverSrc}
        profileSrc={hero.profileSrc}
        authorLine={authorLine}
        authorHref={authorHref}
        sections={sections}
        timelineBlocks={timelineBlocks}
        storyFieldHtml={storyFieldHtml}
        canonicalUrl={canonicalUrl}
      />
    </div>
  );
}
