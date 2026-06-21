import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { loadPublicMedia } from "@/lib/media/load-public-media";
import { MediaListPage } from "@/components/media-list/MediaListPage";

export const metadata = {
  title: "Videos · Family Archive · The Gonsalves Family",
  description:
    "Watch the family's moving image archive. Search and filter videos by file name, description, and who or what they are linked to.",
};

export default async function ArchiveVideosPage() {
  const viewer = await resolvePublicViewer();
  const items = await loadPublicMedia("video", viewer);
  return <MediaListPage items={items} bucket="video" />;
}
