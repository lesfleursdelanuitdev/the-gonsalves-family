import { NextResponse } from "next/server";
import { proxyAdminApiRequest } from "@/lib/auth/admin-api-proxy";
import { getPublicMessageById } from "@/lib/messages/message-queries";
import { requireMessageAuth } from "@/lib/messages/require-message-auth";
import { resolveTreeId } from "@/lib/tree";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireMessageAuth("/messages");
  if (!auth.ok) return auth.response;

  const treeId = await resolveTreeId();
  if (!treeId) {
    return NextResponse.json({ error: "Tree not found" }, { status: 404 });
  }

  const { id } = await context.params;
  const message = await getPublicMessageById({ treeId, userId: auth.user.id, id });
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ message });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireMessageAuth("/messages");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  return proxyAdminApiRequest(request, `/api/admin/messages/${encodeURIComponent(id)}`, "PATCH");
}
