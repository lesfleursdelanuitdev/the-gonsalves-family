import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { loadPublicMedia } from "@/lib/media/load-public-media";
import { MediaListPage } from "@/components/media-list/MediaListPage";

export const metadata = {
  title: "Audio · Family Archive · The Gonsalves Family",
  description:
    "Listen to family voices and recordings. Search and filter audio by file name, description, and who or what it is linked to.",
};

export default async function ArchiveAudioPage() {
  const viewer = await resolvePublicViewer();
  const items = await loadPublicMedia("audio", viewer);
  return <MediaListPage items={items} bucket="audio" />;
}
