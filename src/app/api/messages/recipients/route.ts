import { NextResponse } from "next/server";
import { listMessageRecipients } from "@/lib/messages/message-queries";
import { requireMessageAuth } from "@/lib/messages/require-message-auth";
import { resolveTreeId } from "@/lib/tree";

export async function GET(request: Request) {
  const auth = await requireMessageAuth("/messages/compose");
  if (!auth.ok) return auth.response;

  const treeId = await resolveTreeId();
  if (!treeId) {
    return NextResponse.json({ error: "Tree not found" }, { status: 404 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? undefined;
  const users = await listMessageRecipients({ treeId, userId: auth.user.id, q });
  return NextResponse.json({ users });
}
