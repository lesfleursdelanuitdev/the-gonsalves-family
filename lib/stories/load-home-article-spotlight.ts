import { fetchPublishedStoryBySlug, storyPublicHref } from "@/lib/stories/story-queries";
import { articleCoverSrc, resolveStoryHeroUrls } from "@/lib/stories/story-hero-urls";

export type HomeArticleSpotlight = {
  title: string;
  excerpt: string;
  href: string;
  coverUrl: string;
};

export const HOME_ARTICLE_SPOTLIGHT_SLUG = "sydney-gonsalves-memory-man";

export async function loadHomeArticleSpotlight(
  slug = HOME_ARTICLE_SPOTLIGHT_SLUG,
): Promise<HomeArticleSpotlight | null> {
  const story = await fetchPublishedStoryBySlug(slug);
  if (!story) return null;

  const hero = await resolveStoryHeroUrls({
    coverMediaId: story.coverMediaId,
    coverMediaKind: story.coverMediaKind,
    profileMediaId: story.profileMediaId,
    profileMediaKind: story.profileMediaKind,
  });

  const pathSlug = story.slug?.trim() || slug;
  return {
    title: story.title,
    excerpt: story.excerpt?.trim() || "",
    href: storyPublicHref(story.kind, pathSlug),
    coverUrl: articleCoverSrc(hero.coverSrc, hero.profileSrc),
  };
}
