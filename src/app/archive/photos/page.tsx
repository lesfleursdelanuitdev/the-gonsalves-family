import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { loadPublicMedia } from "@/lib/media/load-public-media";
import { MediaListPage } from "@/components/media-list/MediaListPage";

export const metadata = {
  title: "Photos · Family Archive · The Gonsalves Family",
  description:
    "Browse preserved family photos. Search and filter images by file name, description, and who or what they are linked to.",
};

export default async function ArchivePhotosPage() {
  const viewer = await resolvePublicViewer();
  const items = await loadPublicMedia("image", viewer);
  return <MediaListPage items={items} bucket="image" />;
}
