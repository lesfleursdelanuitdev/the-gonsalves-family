import { NextResponse } from "next/server";
import { authRequiredResponse } from "@/lib/auth/auth-required-response";
import { canViewFullIndividual, resolvePublicViewer } from "@/lib/auth/public-viewer-context";

export function isLivingFromPersonRow(row: { is_living?: unknown; isLiving?: unknown }): boolean {
  if (typeof row.isLiving === "boolean") return row.isLiving;
  return Boolean(row.is_living);
}

export async function gateLivingIndividualAccess(
  isLiving: boolean,
  returnPath: string,
): Promise<NextResponse | null> {
  if (!isLiving) return null;
  const viewer = await resolvePublicViewer();
  if (canViewFullIndividual(viewer, isLiving)) return null;
  return authRequiredResponse(returnPath);
}

export async function gateLivingIndividualAccessById(
  isLiving: boolean,
  individualId: string,
): Promise<NextResponse | null> {
  return gateLivingIndividualAccess(isLiving, `/individuals/${encodeURIComponent(individualId)}`);
}
