import { NextResponse } from "next/server";
import { SITE_ADMIN_ORIGIN } from "@/lib/siteAdminLogin";

export async function proxyAdminAuthRequest(
  request: Request,
  path: string,
  method: "POST" | "GET" | "PATCH",
): Promise<NextResponse> {
  const contentType = request.headers.get("content-type");
  const body = method === "GET" ? undefined : await request.text();
  const upstream = await fetch(`${SITE_ADMIN_ORIGIN}${path}`, {
    method,
    headers: contentType ? { "Content-Type": contentType } : undefined,
    body,
    cache: "no-store",
  });

  const upstreamContentType = upstream.headers.get("content-type") ?? "application/json";
  const raw = await upstream.text();
  const response = new NextResponse(raw || null, {
    status: upstream.status,
    headers: { "Content-Type": upstreamContentType },
  });
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}
