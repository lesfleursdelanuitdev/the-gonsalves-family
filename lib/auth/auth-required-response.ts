import { NextResponse } from "next/server";
import { buildLoginWallPath } from "@/lib/auth/public-viewer-context";

export type AuthRequiredBody = {
  error: string;
  requiresAuth: true;
  loginUrl: string;
};

export function authRequiredResponse(returnPath: string): NextResponse<AuthRequiredBody> {
  return NextResponse.json(
    {
      error: "Authentication required",
      requiresAuth: true,
      loginUrl: buildLoginWallPath(returnPath),
    },
    { status: 401 },
  );
}
