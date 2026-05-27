import { StoryKind } from "@ligneous/prisma";
import { StoriesListPage } from "@/components/stories/StoriesListPage";
import { fetchPublishedStoriesList, type StoryListItem } from "@/lib/stories/story-queries";

export default async function ArticlesPage() {
  let stories: StoryListItem[];
  try {
    stories = await fetchPublishedStoriesList([StoryKind.article, StoryKind.post]);
  } catch {
    stories = [];
  }

  return (
    <StoriesListPage
      stories={stories}
      heading="Articles"
      description="In-depth articles exploring our family's heritage, history, and the communities that shaped us."
      emptyMessage="No articles have been published yet."
    />
  );
}
