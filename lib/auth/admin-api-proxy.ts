import { NextResponse } from "next/server";
import { SITE_ADMIN_ORIGIN } from "@/lib/siteAdminLogin";

export async function proxyAdminApiRequest(
  request: Request,
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  bodyText?: string,
): Promise<NextResponse> {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = `${SITE_ADMIN_ORIGIN}${path}${incomingUrl.search}`;
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  const body =
    bodyText ??
    (method === "GET" || method === "DELETE" ? undefined : await request.text());

  const upstream = await fetch(upstreamUrl, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
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
