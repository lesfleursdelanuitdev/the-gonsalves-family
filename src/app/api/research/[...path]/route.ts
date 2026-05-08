import { NextRequest, NextResponse } from "next/server";

import { getPublicResearchTreeId } from "@/lib/research-public-tree";

const PYTHON_API_URL = (process.env.PYTHON_API_URL ?? "http://127.0.0.1:5001").replace(/\/$/, "");

function researchUpstreamOrigin(): string {
  try {
    const u = new URL(PYTHON_API_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "(invalid PYTHON_API_URL)";
  }
}

function reachabilityCause(err: unknown): string | undefined {
  const msg = err instanceof Error ? err.message : String(err);
  if (/ECONNREFUSED/i.test(msg)) return "connection_refused";
  if (/ENOTFOUND/i.test(msg)) return "dns_not_found";
  if (/ETIMEDOUT|timeout/i.test(msg)) return "timed_out";
  if (/fetch failed/i.test(msg)) return "fetch_failed";
  return undefined;
}

function buildTargetUrl(request: NextRequest, pathSegments: string[]): string {
  const path = pathSegments.join("/");
  const qs = request.nextUrl.searchParams.toString();
  return `${PYTHON_API_URL}/api/research/${path}${qs ? `?${qs}` : ""}`;
}

async function proxy(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }, method: string) {
  const { path: pathSegments } = await ctx.params;
  if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
    return NextResponse.json({ error: "Missing research path" }, { status: 400 });
  }

  const treeScoped = pathSegments[0] === "trees" && pathSegments[1];

  /**
   * Enforce exactly one tree for this anonymous proxy (read-only public site).
   * Optional NL analytics persistence is disabled — see X-Research-Persist on upstream.
   */
  if (treeScoped) {
    const requestedTreeId = pathSegments[1];
    const allowedTreeId = await getPublicResearchTreeId();
    if (!allowedTreeId || requestedTreeId !== allowedTreeId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          detail:
            "This site only proxies research APIs for its configured public tree. Set PUBLIC_RESEARCH_TREE_ID or PUBLIC_STORY_TREE_ID if detection by name fails.",
        },
        { status: 403 },
      );
    }
  }

  const url = buildTargetUrl(request, pathSegments);
  /** Public site uses a read-only DB role; never persist NL runs / result sets to `research.*`. */
  const headers: Record<string, string> = { "X-Research-Persist": "false" };
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  const fetchOpts: RequestInit = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    fetchOpts.body = await request.text();
  }

  try {
    const res = await fetch(url, fetchOpts);
    const text = await res.text();
    const responseContentType = res.headers.get("content-type") ?? "application/json";

    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": responseContentType },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const cause = reachabilityCause(err);
    return NextResponse.json(
      {
        error: "Research API unavailable",
        upstream: researchUpstreamOrigin(),
        hint: "Start ligneous-python-api (or fix its listen address) and ensure PYTHON_API_URL matches for this Next.js process. PM2: set env in `.env.local` / `.env.production` here, then `pm2 restart temp-gonsalvesfamily --update-env`.",
        cause,
        detail: process.env.NODE_ENV !== "production" ? message : undefined,
      },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx, "GET");
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx, "POST");
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx, "PUT");
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx, "PATCH");
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, ctx, "DELETE");
}
