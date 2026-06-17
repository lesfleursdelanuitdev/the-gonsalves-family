import { authCookieName, getCurrentUserFromToken, type SessionUser } from "@ligneous/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/database/prisma";
import {
  buildLoginWallPath,
  decodeReturnToParam,
  sanitizePublicReturnPathExcludingLogin,
} from "@/lib/auth/public-return-path";

export { buildLoginWallPath };

export type PublicViewer =
  | { kind: "anonymous" }
  | { kind: "authenticated"; user: SessionUser };

export function isAuthenticatedViewer(viewer: PublicViewer): viewer is { kind: "authenticated"; user: SessionUser } {
  return viewer.kind === "authenticated";
}

export function canViewFullIndividual(viewer: PublicViewer, isLiving: boolean): boolean {
  if (!isLiving) return true;
  return isAuthenticatedViewer(viewer);
}

export async function resolvePublicViewer(): Promise<PublicViewer> {
  const jar = await cookies();
  const token = jar.get(authCookieName())?.value ?? null;
  const user = await getCurrentUserFromToken(prisma, token, { touchSession: false });
  if (!user) return { kind: "anonymous" };
  return { kind: "authenticated", user };
}

export function loginWallPathFromReturnToParam(encoded: string | null | undefined): string | null {
  const decoded = decodeReturnToParam(encoded);
  const safe = sanitizePublicReturnPathExcludingLogin(decoded);
  if (!safe) return null;
  return buildLoginWallPath(safe);
}
