import type { SessionUser } from "@ligneous/auth";
import { buildLoginWallPath } from "@/lib/auth/public-return-path";

export { buildLoginWallPath };

export type PublicViewer =
  | { kind: "anonymous" }
  | { kind: "authenticated"; user: SessionUser };

export function isAuthenticatedViewer(
  viewer: PublicViewer,
): viewer is { kind: "authenticated"; user: SessionUser } {
  return viewer.kind === "authenticated";
}

export function canViewFullIndividual(viewer: PublicViewer, isLiving: boolean): boolean {
  if (!isLiving) return true;
  return isAuthenticatedViewer(viewer);
}
