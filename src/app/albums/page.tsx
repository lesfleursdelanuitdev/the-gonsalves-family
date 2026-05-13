import { Navbar } from "@/components/navbar";
import { PublicAlbumsPage } from "@/components/albums/PublicAlbumsPage";

export default function AlbumsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <PublicAlbumsPage />
    </div>
  );
}
