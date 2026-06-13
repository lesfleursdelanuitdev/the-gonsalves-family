import { loadPublicPhotos } from "@/lib/media/load-public-photos";
import { PhotosListPage } from "@/components/photos/PhotosListPage";

export const metadata = {
  title: "Photos · Family Archive · The Gonsalves Family",
  description:
    "Browse preserved family photos. Search and filter images by file name, description, and who or what they are linked to.",
};

export default async function ArchivePhotosPage() {
  const photos = await loadPublicPhotos();
  return <PhotosListPage photos={photos} />;
}
