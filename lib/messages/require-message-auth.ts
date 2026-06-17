import type { SessionUser } from "@ligneous/auth";
import { NextResponse } from "next/server";
import { authRequiredResponse } from "@/lib/auth/auth-required-response";
import {
  isAuthenticatedViewer,
  resolvePublicViewer,
  type PublicViewer,
} from "@/lib/auth/public-viewer-context";

export type MessageAuthResult =
  | { ok: true; user: SessionUser; viewer: PublicViewer & { kind: "authenticated" } }
  | { ok: false; response: NextResponse };

export async function requireMessageAuth(returnPath: string): Promise<MessageAuthResult> {
  const viewer = await resolvePublicViewer();
  if (!isAuthenticatedViewer(viewer)) {
    return { ok: false, response: authRequiredResponse(returnPath) };
  }
  return { ok: true, user: viewer.user, viewer };
}
