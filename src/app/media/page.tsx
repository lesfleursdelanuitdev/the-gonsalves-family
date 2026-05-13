import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PublicAlbumsPage } from "@/components/albums/PublicAlbumsPage";
import { loadPublicAlbumsPageData } from "@/lib/album/load-public-albums-page-data";
import { prisma } from "@/lib/database/prisma";
import type { PublicAlbumsPageData } from "@/lib/album/public-albums-page-types";
import { parseMediaHubCollection } from "@/lib/media/media-hub-collection";
import { resolveTreeFileUuid } from "@/lib/tree";

export const dynamic = "force-dynamic";

const EMPTY_ALBUMS_DATA: PublicAlbumsPageData = {
  curatedAlbums: [],
  generatedIndividualAlbums: [],
  generatedFamilyAlbums: [],
  generatedEventAlbums: [],
  generatedPlaceAlbums: [],
  generatedDateAlbums: [],
  generatedTagAlbums: [],
};

type SearchParams = Promise<{ collection?: string }>;

export default async function MediaPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const activeCollection = parseMediaHubCollection(sp.collection);

  const fileUuid = await resolveTreeFileUuid();
  const data = fileUuid
    ? await loadPublicAlbumsPageData(prisma, fileUuid)
    : EMPTY_ALBUMS_DATA;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <PublicAlbumsPage data={data} activeCollection={activeCollection} />
    </div>
  );
}
