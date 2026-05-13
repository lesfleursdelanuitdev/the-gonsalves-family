import { AlbumGeneratorPage } from "@/components/album-generator/AlbumGeneratorPage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";

export default function ScrapbookGeneratorRoute() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <AlbumGeneratorPage />
    </div>
  );
}
