import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Set no-cache on HTML/document responses so after each deploy clients
 * get fresh HTML with current asset URLs. Prevents "CSS/code not loading"
 * when old cached HTML points at previous build's chunk hashes (404).
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0"
  );
  response.headers.set("Pragma", "no-cache");
  return response;
}
