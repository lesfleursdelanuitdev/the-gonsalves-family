import { StoryKind } from "@ligneous/prisma";
import { StoriesListPage } from "@/components/stories/StoriesListPage";
import { fetchPublishedStoriesList, type StoryListItem } from "@/lib/stories/story-queries";

export default async function StoriesPage() {
  let stories: StoryListItem[];
  try {
    stories = await fetchPublishedStoriesList([StoryKind.story, StoryKind.folklore]);
  } catch {
    stories = [];
  }

  return (
    <StoriesListPage
      stories={stories}
      heading="Stories"
      description="Discover the stories and folklore that bring our family's history to life — from personal accounts to oral traditions passed down through generations."
      emptyMessage="No stories have been published yet."
    />
  );
}
