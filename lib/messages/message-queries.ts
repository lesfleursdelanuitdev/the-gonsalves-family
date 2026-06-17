import { Prisma } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";
import {
  getTreeCommunityUserIds,
  messageParticipantWhere,
  treeScopedMessageWhere,
} from "./message-tree-scope";

const MESSAGE_USER_SELECT = {
  id: true,
  username: true,
  name: true,
} as const;

export type PublicMessageListItem = {
  id: string;
  subject: string | null;
  contentPreview: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  conversationId: string | null;
  sender: { id: string; username: string; displayName: string };
  recipient: { id: string; username: string; displayName: string } | null;
};

function displayName(user: { name: string | null; username: string }): string {
  return user.name?.trim() || user.username;
}

function contentPreview(content: string, max = 120): string {
  const trimmed = content.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function mapMessageRow(
  row: {
    id: string;
    subject: string | null;
    content: string;
    createdAt: Date;
    isRead: boolean;
    readAt: Date | null;
    conversationId: string | null;
    sender: { id: string; username: string; name: string | null };
    recipient: { id: string; username: string; name: string | null } | null;
  },
): PublicMessageListItem {
  return {
    id: row.id,
    subject: row.subject,
    content: row.content,
    contentPreview: contentPreview(row.content),
    createdAt: row.createdAt.toISOString(),
    isRead: row.isRead,
    readAt: row.readAt?.toISOString() ?? null,
    conversationId: row.conversationId,
    sender: {
      id: row.sender.id,
      username: row.sender.username,
      displayName: displayName(row.sender),
    },
    recipient: row.recipient
      ? {
          id: row.recipient.id,
          username: row.recipient.username,
          displayName: displayName(row.recipient),
        }
      : null,
  };
}

export async function listPublicMessages(args: {
  treeId: string;
  userId: string;
  folder: "inbox" | "sent";
  limit: number;
  offset: number;
  q?: string;
}): Promise<{ messages: PublicMessageListItem[]; total: number; hasMore: boolean }> {
  const communityIds = await getTreeCommunityUserIds(args.treeId);
  const scope = treeScopedMessageWhere(args.treeId, communityIds);
  const parts: Prisma.MessageWhereInput[] = [scope, messageParticipantWhere(args.userId)];
  if (args.folder === "inbox") parts.push({ recipientId: args.userId });
  if (args.folder === "sent") parts.push({ senderId: args.userId });
  if (args.q?.trim()) {
    parts.push({
      OR: [
        { subject: { contains: args.q.trim(), mode: "insensitive" } },
        { content: { contains: args.q.trim(), mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.MessageWhereInput = parts.length === 1 ? parts[0]! : { AND: parts };

  const [rows, total] = await Promise.all([
    prisma.message.findMany({
      where,
      skip: args.offset,
      take: args.limit,
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: MESSAGE_USER_SELECT },
        recipient: { select: MESSAGE_USER_SELECT },
      },
    }),
    prisma.message.count({ where }),
  ]);

  return {
    messages: rows.map(mapMessageRow),
    total,
    hasMore: args.offset + args.limit < total,
  };
}

export async function getPublicMessageById(args: {
  treeId: string;
  userId: string;
  id: string;
}): Promise<PublicMessageListItem | null> {
  const communityIds = await getTreeCommunityUserIds(args.treeId);
  const scope = treeScopedMessageWhere(args.treeId, communityIds);
  const participant = messageParticipantWhere(args.userId);
  const row = await prisma.message.findFirst({
    where: { AND: [{ id: args.id }, scope, participant] },
    include: {
      sender: { select: MESSAGE_USER_SELECT },
      recipient: { select: MESSAGE_USER_SELECT },
    },
  });
  return row ? mapMessageRow(row) : null;
}

export async function listMessageRecipients(args: {
  treeId: string;
  userId: string;
  q?: string;
}): Promise<Array<{ id: string; username: string; displayName: string }>> {
  const ids = (await getTreeCommunityUserIds(args.treeId)).filter((id) => id !== args.userId);
  if (ids.length === 0) return [];

  const q = args.q?.trim();
  const users = await prisma.user.findMany({
    where: {
      id: { in: ids },
      isActive: true,
      ...(q
        ? {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { username: "asc" },
    take: 50,
    select: {
      id: true,
      username: true,
      name: true,
      profile: { select: { allowDirectMessages: true } },
    },
  });

  return users
    .filter((user) => user.profile?.allowDirectMessages !== false)
    .map((user) => ({
      id: user.id,
      username: user.username,
      displayName: displayName(user),
    }));
}

export async function recipientAllowsDirectMessages(recipientId: string): Promise<boolean> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId: recipientId },
    select: { allowDirectMessages: true },
  });
  return profile?.allowDirectMessages !== false;
}
