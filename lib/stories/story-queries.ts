import { StoryKind, StoryStatus, type Prisma } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";

/** Matches admin `STORY_DB_READ_INCLUDE` subset needed for public reading. */
export const STORY_PUBLIC_READ_INCLUDE = {
  author: { select: { id: true, name: true, username: true } },
  chapters: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      sections: { orderBy: { sortOrder: "asc" as const } },
    },
  },
  storyIndividuals: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      individual: { select: { id: true, fullName: true, xref: true } },
    },
  },
  storyFamilies: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      family: { select: { id: true, xref: true } },
    },
  },
  storyEvents: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      event: { select: { id: true, eventType: true, customType: true } },
    },
  },
  storyPlaces: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      place: {
        select: {
          id: true,
          original: true,
          name: true,
          county: true,
          state: true,
          country: true,
        },
      },
    },
  },
  albumStories: {
    orderBy: { sortOrder: "asc" as const },
    include: { album: { select: { id: true, name: true } } },
  },
} satisfies Prisma.StoryInclude;

export type StoryPublicPayload = Prisma.StoryGetPayload<{ include: typeof STORY_PUBLIC_READ_INCLUDE }>;

function requirePublicTreeId(): string {
  const id = process.env.PUBLIC_STORY_TREE_ID?.trim();
  if (!id) {
    throw new Error("PUBLIC_STORY_TREE_ID is not set. Add it to the-gonsalves-family environment for story routes.");
  }
  return id;
}

export async function fetchPublishedStoryBySlug(slug: string): Promise<StoryPublicPayload | null> {
  const treeId = requirePublicTreeId();
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  return prisma.story.findFirst({
    where: {
      treeId,
      slug: normalized,
      deletedAt: null,
      status: StoryStatus.published,
    },
    include: STORY_PUBLIC_READ_INCLUDE,
  });
}

export function prismaKindToPublic(kind: StoryKind): "story" | "article" | "post" | "folklore" {
  if (kind === StoryKind.article) return "article";
  if (kind === StoryKind.post) return "post";
  if (kind === StoryKind.folklore) return "folklore";
  return "story";
}
