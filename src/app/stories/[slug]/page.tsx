import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { StoryArticlePage } from "@/components/stories/StoryArticlePage";
import { fetchPublishedStoryBySlug } from "@/lib/stories/story-queries";

export default async function StoryPublicPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  let story;
  try {
    story = await fetchPublishedStoryBySlug(slug);
  } catch {
    throw new Error("Story routes require PUBLIC_STORY_TREE_ID to be configured.");
  }
  if (!story) notFound();

  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />
      <StoryArticlePage story={story} urlSlug={slug} />
    </div>
  );
}
