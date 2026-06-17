import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  buildLoginWallPath,
  isAuthenticatedViewer,
  resolvePublicViewer,
} from "@/lib/auth/public-viewer-context";

export const metadata: Metadata = {
  title: "Messages · The Gonsalves Family",
};

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const viewer = await resolvePublicViewer();
  if (!isAuthenticatedViewer(viewer)) {
    redirect(buildLoginWallPath("/messages"));
  }
  return children;
}
