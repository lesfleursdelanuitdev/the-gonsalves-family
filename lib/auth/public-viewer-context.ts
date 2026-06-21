import { authCookieName, getCurrentUserFromToken } from "@ligneous/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/database/prisma";
import {
  buildLoginWallPath,
  decodeReturnToParam,
  sanitizePublicReturnPathExcludingLogin,
} from "@/lib/auth/public-return-path";
import type { PublicViewer } from "@/lib/auth/public-viewer";

export {
  buildLoginWallPath,
  canViewFullIndividual,
  isAuthenticatedViewer,
  type PublicViewer,
} from "@/lib/auth/public-viewer";

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
