import type { ReactNode } from "react";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";

type AlbumViewRouteShellProps = {
  children: ReactNode;
};

/** Navbar + page content + site footer for public curated and generated album views. */
export function AlbumViewRouteShell({ children }: AlbumViewRouteShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg font-body text-text">
      <Navbar />
      <div className="min-h-0 flex-1">{children}</div>
      <Footer />
    </div>
  );
}
