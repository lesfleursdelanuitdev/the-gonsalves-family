import { prisma } from "@/lib/database/prisma";
import {
  getTreeCommunityUserIds,
  messageParticipantWhere,
  treeScopedMessageWhere,
} from "./message-tree-scope";

export async function countUnreadTreeInboxForUser(userId: string, treeId: string): Promise<number> {
  const communityIds = await getTreeCommunityUserIds(treeId);
  const scope = treeScopedMessageWhere(treeId, communityIds);
  const participant = messageParticipantWhere(userId);
  return prisma.message.count({
    where: {
      AND: [scope, participant, { recipientId: userId }, { isRead: false }],
    },
  });
}
