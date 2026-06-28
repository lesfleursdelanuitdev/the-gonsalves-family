import { HomePageClient } from "@/app/HomePageClient";
import { loadHomeArticleSpotlight } from "@/lib/stories/load-home-article-spotlight";

export default async function Home() {
  let articleSpotlight = null;
  try {
    articleSpotlight = await loadHomeArticleSpotlight();
  } catch {
    articleSpotlight = null;
  }

  return <HomePageClient articleSpotlight={articleSpotlight} />;
}
