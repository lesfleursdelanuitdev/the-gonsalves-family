import { NextResponse } from "next/server";
import { countUnreadTreeInboxForUser } from "@/lib/messages/message-unread";
import { requireMessageAuth } from "@/lib/messages/require-message-auth";
import { resolveTreeId } from "@/lib/tree";

export async function GET() {
  const auth = await requireMessageAuth("/messages");
  if (!auth.ok) return auth.response;

  const treeId = await resolveTreeId();
  if (!treeId) {
    return NextResponse.json({ error: "Tree not found" }, { status: 404 });
  }

  const count = await countUnreadTreeInboxForUser(auth.user.id, treeId);
  return NextResponse.json({ count });
}
