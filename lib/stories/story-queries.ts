import { StoryKind, StoryStatus, type Prisma } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";
import { parseStoryBodyMeta, publicAuthorCreditRole, type PublicStoryAuthorCredit, type StoryBodyMetaParsed } from "@/lib/stories/story-public-meta";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import { resolveTreeFileUuid } from "@/lib/tree";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
  type IndividualDisplayPhotoMedia,
} from "@/lib/tree/individual-display-photo";

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
  storySources: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          author: true,
          publication: true,
          abbreviation: true,
          text: true,
          callNumber: true,
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

export async function fetchPublishedSectionBlocks(sectionId: string): Promise<unknown[] | null> {
  const treeId = requirePublicTreeId();
  const section = await prisma.storySection.findFirst({
    where: {
      id: sectionId,
      chapter: { story: { treeId, status: StoryStatus.published, deletedAt: null } },
    },
    select: { contentJson: true },
  });
  if (!section) return null;
  const raw = (section.contentJson as { blocks?: unknown })?.blocks;
  return Array.isArray(raw) ? raw : [];
}

export function prismaKindToPublic(kind: StoryKind): "story" | "article" | "post" | "folklore" {
  if (kind === StoryKind.article) return "article";
  if (kind === StoryKind.post) return "post";
  if (kind === StoryKind.folklore) return "folklore";
  return "story";
}

const STORY_LIST_INCLUDE_INTERNAL = {
  author: { select: { id: true, name: true, username: true } },
  storyIndividuals: {
    orderBy: { sortOrder: "asc" as const },
    include: { individual: { select: { id: true, fullName: true, xref: true } } },
  },
  storyFamilies: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      family: {
        select: {
          id: true,
          xref: true,
          husband: { select: { id: true, fullName: true } },
          wife: { select: { id: true, fullName: true } },
        },
      },
    },
  },
  storyEvents: {
    orderBy: { sortOrder: "asc" as const },
    include: { event: { select: { id: true, eventType: true, customType: true } } },
  },
} satisfies Prisma.StoryInclude;

type StoryListRaw = Prisma.StoryGetPayload<{ include: typeof STORY_LIST_INCLUDE_INTERNAL }>;

/** Lean list item: body is parsed server-side and stripped before sending to the client. */
export type StoryListItem = Omit<StoryListRaw, "body"> & {
  parsedAuthors: PublicStoryAuthorCredit[];
  coverUrl: string | null;
};

async function batchResolveCoverUrls(rows: StoryListRaw[]): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();

  const allIds = rows.filter((r) => r.coverMediaId).map((r) => r.coverMediaId!);
  if (!allIds.length) return urlMap;

  // Admin-uploaded cover images are stored in gedcomMedia regardless of the
  // coverMediaKind label (older records were incorrectly labelled "user_media").
  // Try gedcomMedia for every ID first, then fall back to site/user tables.
  const gedcomRows = await prisma.gedcomMedia.findMany({
    where: { id: { in: allIds } },
    select: { id: true, fileRef: true },
  });
  for (const row of gedcomRows) {
    const url = resolveGedcomMediaFileRef(row.fileRef);
    if (url) urlMap.set(row.id, url);
  }

  // Resolve any IDs not found in gedcomMedia via site/user tables.
  // Do not trust coverMediaKind here — admin saves can label the wrong table
  // (see resolveStoryHeroUrls in story-hero-urls.ts).
  const unresolved = allIds.filter((id) => !urlMap.has(id));
  if (unresolved.length > 0) {
    const [siteRows, userRows] = await Promise.all([
      prisma.siteMedia.findMany({ where: { id: { in: unresolved } }, select: { id: true, fileRef: true, storageKey: true } }),
      prisma.userMedia.findMany({ where: { id: { in: unresolved } }, select: { id: true, fileRef: true, storageKey: true } }),
    ]);
    for (const row of [...siteRows, ...userRows]) {
      const url = resolveGedcomMediaFileRef(row.fileRef ?? row.storageKey);
      if (url) urlMap.set(row.id, url);
    }
  }

  return urlMap;
}

function authorCreditsWithAvatars(
  meta: StoryBodyMetaParsed,
  dbAuthorName: string | null | undefined,
  xrefToPersonId: Map<string, string>,
  photoByPersonId: Map<string, IndividualDisplayPhotoMedia>,
): PublicStoryAuthorCredit[] {
  let authors = meta.authors;
  if (authors.length === 0) {
    const n = dbAuthorName?.trim();
    if (n) authors = [{ name: n, authorPrefixMode: "by" }];
  }

  return authors
    .map((author) => {
      const name = author.name?.trim();
      if (!name) return null;
      const personId =
        author.personId ??
        (author.personXref ? xrefToPersonId.get(author.personXref) : undefined);
      const avatarUrl = personId
        ? individualDisplayPhotoMediaToPublicUrl(photoByPersonId.get(personId)) ?? null
        : null;
      const credit: PublicStoryAuthorCredit = {
        role: publicAuthorCreditRole(author),
        name,
      };
      if (personId) credit.personId = personId;
      if (avatarUrl) credit.avatarUrl = avatarUrl;
      return credit;
    })
    .filter((credit): credit is PublicStoryAuthorCredit => credit != null);
}

async function batchResolveAuthorAvatars(
  rows: StoryListRaw[],
): Promise<{
  xrefToPersonId: Map<string, string>;
  photoByPersonId: Map<string, IndividualDisplayPhotoMedia>;
}> {
  const xrefToPersonId = new Map<string, string>();
  const photoByPersonId = new Map<string, IndividualDisplayPhotoMedia>();

  const personIds = new Set<string>();
  const xrefs = new Set<string>();
  for (const row of rows) {
    for (const author of parseStoryBodyMeta(row.body).authors) {
      if (author.personId) personIds.add(author.personId);
      else if (author.personXref) xrefs.add(author.personXref);
    }
  }

  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return { xrefToPersonId, photoByPersonId };

  if (xrefs.size > 0) {
    const individuals = await prisma.gedcomIndividual.findMany({
      where: { fileUuid, xref: { in: [...xrefs] } },
      select: { id: true, xref: true },
    });
    for (const individual of individuals) {
      xrefToPersonId.set(individual.xref, individual.id);
      personIds.add(individual.id);
    }
  }

  if (personIds.size === 0) return { xrefToPersonId, photoByPersonId };

  const photos = await batchIndividualDisplayPhotoMedia(prisma, fileUuid, [...personIds]);
  return { xrefToPersonId, photoByPersonId: photos };
}

export async function fetchPublishedStoriesList(kinds: StoryKind[]): Promise<StoryListItem[]> {
  const treeId = requirePublicTreeId();
  const rows = await prisma.story.findMany({
    where: {
      treeId,
      kind: { in: kinds },
      deletedAt: null,
      status: StoryStatus.published,
    },
    include: STORY_LIST_INCLUDE_INTERNAL,
    orderBy: { updatedAt: "desc" },
  });

  const coverUrlMap = await batchResolveCoverUrls(rows);
  const { xrefToPersonId, photoByPersonId } = await batchResolveAuthorAvatars(rows);

  return rows.map(({ body, author, ...rest }) => {
    const dbAuthorName = author?.name?.trim() || author?.username?.trim() || null;
    const parsedAuthors = authorCreditsWithAvatars(
      parseStoryBodyMeta(body),
      dbAuthorName,
      xrefToPersonId,
      photoByPersonId,
    );
    const coverUrl = rest.coverMediaId ? (coverUrlMap.get(rest.coverMediaId) ?? null) : null;
    return { ...rest, author, parsedAuthors, coverUrl };
  });
}
