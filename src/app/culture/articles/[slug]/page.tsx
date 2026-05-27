import { notFound } from "next/navigation";
import { StoryKind } from "@ligneous/prisma";
import { StoryArticlePage } from "@/components/stories/StoryArticlePage";
import { fetchPublishedStoryBySlug } from "@/lib/stories/story-queries";

const ARTICLE_KINDS = new Set<StoryKind>([StoryKind.article, StoryKind.post]);

export default async function ArticlePublicPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  let story;
  try {
    story = await fetchPublishedStoryBySlug(slug);
  } catch {
    throw new Error("Article routes require PUBLIC_STORY_TREE_ID to be configured.");
  }
  if (!story || !ARTICLE_KINDS.has(story.kind)) notFound();

  return <StoryArticlePage story={story} urlSlug={slug} />;
}
