import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { loadPublicMedia } from "@/lib/media/load-public-media";
import { MediaListPage } from "@/components/media-list/MediaListPage";

export const metadata = {
  title: "Documents · Family Archive · The Gonsalves Family",
  description:
    "Browse family documents — letters, records, and papers. Search and filter by file name, description, and who or what they are linked to.",
};

export default async function ArchiveDocumentsPage() {
  const viewer = await resolvePublicViewer();
  const items = await loadPublicMedia("document", viewer);
  return <MediaListPage items={items} bucket="document" />;
}
