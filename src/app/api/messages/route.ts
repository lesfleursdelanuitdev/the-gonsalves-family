import { NextResponse } from "next/server";
import { proxyAdminApiRequest } from "@/lib/auth/admin-api-proxy";
import { listPublicMessages, recipientAllowsDirectMessages } from "@/lib/messages/message-queries";
import { requireMessageAuth } from "@/lib/messages/require-message-auth";
import { resolveTreeId } from "@/lib/tree";

function parseFolder(raw: string | null): "inbox" | "sent" {
  return raw === "sent" ? "sent" : "inbox";
}

export async function GET(request: Request) {
  const auth = await requireMessageAuth("/messages");
  if (!auth.ok) return auth.response;

  const treeId = await resolveTreeId();
  if (!treeId) {
    return NextResponse.json({ error: "Tree not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const folder = parseFolder(url.searchParams.get("folder"));
  const q = url.searchParams.get("q") ?? undefined;
  const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const offsetRaw = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 50;
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

  const result = await listPublicMessages({
    treeId,
    userId: auth.user.id,
    folder,
    limit,
    offset,
    q,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireMessageAuth("/messages");
  if (!auth.ok) return auth.response;

  const rawBody = await request.text();
  let body: {
    recipientId?: string;
    recipientIds?: string[];
  } | null = null;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const recipientId =
    typeof body?.recipientId === "string"
      ? body.recipientId.trim()
      : Array.isArray(body?.recipientIds) && typeof body.recipientIds[0] === "string"
        ? body.recipientIds[0].trim()
        : "";

  if (recipientId) {
    const allowed = await recipientAllowsDirectMessages(recipientId);
    if (!allowed) {
      return NextResponse.json(
        { error: "This member is not accepting direct messages" },
        { status: 403 },
      );
    }
  }

  return proxyAdminApiRequest(request, "/api/admin/messages", "POST", rawBody);
}
