import { familyPairLabel } from "@ligneous/album-generated-queries";
import { gedcomNameToDisplayName } from "@ligneous/album-view";
import { prisma } from "@/lib/database/prisma";
import {
  isMediaLinkedToAnyLivingPeople,
  MEDIA_LIVING_LINK_SELECT,
  shouldGateLivingLinkedEntity,
} from "@/lib/auth/living-exclusive-media";
import {
  formatMinimalLivingLabel,
  shouldRedactLivingPerson,
} from "@/lib/auth/living-person-privacy";
import { buildLoginWallPath } from "@/lib/auth/public-viewer";
import type { PublicViewer } from "@/lib/auth/public-viewer-context";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { eventTitle, dateLabelFromParts } from "@/lib/timeline/public-timeline";
import { resolveTreeFileUuid } from "@/lib/tree";
import { sourceDisplayLabel } from "@/components/research/source-label";
import {
  isPublicSafeOpenQuestionCoverMedia,
  openQuestionMediaRasterUrl,
  pickOpenQuestionCoverSrc,
  type OpenQuestionCoverMedia,
} from "@/lib/research/open-question-cover";

export type PublicOpenQuestion = {
  id: string;
  question: string;
  details: string | null;
  createdAtLabel: string;
  createdAtTime: number;
  individualsCount: number;
  familiesCount: number;
  eventsCount: number;
  mediaCount: number;
  linkedIndividual: { id: string; fullName: string } | null;
  coverSrc: string | null;
  href: string;
};

export type PublicOpenQuestionLink =
  | { kind: "individual"; id: string; label: string; href: string }
  | { kind: "family"; id: string; label: string; href: string }
  | { kind: "event"; id: string; label: string; href: string }
  | { kind: "media"; id: string; label: string; href: string; coverSrc: string | null; privacyRestricted: boolean }
  | { kind: "source"; id: string; label: string; href: string }
  | { kind: "note"; id: string; label: string; href: string };

export type PublicOpenQuestionDetail = PublicOpenQuestion & {
  links: PublicOpenQuestionLink[];
};

const OPEN_QUESTION_MEDIA_SELECT = {
  fileRef: true,
  form: true,
  title: true,
  ...MEDIA_LIVING_LINK_SELECT,
} as const;

const OPEN_QUESTION_BASE_SELECT = {
  id: true,
  question: true,
  details: true,
  createdAt: true,
  status: true,
  _count: {
    select: {
      individualLinks: true,
      familyLinks: true,
      eventLinks: true,
      mediaLinks: true,
    },
  },
  individualLinks: {
    select: {
      individual: {
        select: {
          id: true,
          xref: true,
          fullName: true,
          isLiving: true,
          birthDate: { select: { year: true } },
        },
      },
    },
  },
  familyLinks: {
    select: {
      family: {
        select: {
          id: true,
          xref: true,
          husband: { select: { id: true, xref: true, fullName: true } },
          wife: { select: { id: true, xref: true, fullName: true } },
        },
      },
    },
  },
  eventLinks: {
    select: {
      event: {
        select: {
          id: true,
          eventType: true,
          customType: true,
          eventLabel: true,
          date: { select: { original: true, year: true } },
        },
      },
    },
  },
  mediaLinks: {
    select: {
      media: {
        select: OPEN_QUESTION_MEDIA_SELECT,
      },
    },
  },
  sourceLinks: {
    select: {
      source: {
        select: {
          id: true,
          xref: true,
          title: true,
          author: true,
          publication: true,
        },
      },
    },
  },
  noteLinks: {
    select: {
      note: {
        select: {
          id: true,
          xref: true,
          content: true,
        },
      },
    },
  },
} as const;

type OpenQuestionRow = NonNullable<Awaited<ReturnType<typeof fetchOpenQuestionRow>>>;

function dateOnlyLabel(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function openQuestionHref(id: string): string {
  return `/research/open-questions/${encodeURIComponent(id)}`;
}

function notePreview(content: string | null): string {
  const text = (content ?? "").trim().replace(/\s+/g, " ");
  if (!text) return "Note";
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}

function mediaLabel(title: string | null | undefined, fileRef: string | null | undefined): string {
  const named = title?.trim();
  if (named) return named;
  const ref = (fileRef ?? "").trim();
  if (!ref) return "Media";
  const base = ref.split(/[?#]/)[0]?.split("/").pop() ?? ref;
  try {
    return decodeURIComponent(base) || "Media";
  } catch {
    return base || "Media";
  }
}

async function fetchOpenQuestionRow(id: string, fileUuid: string) {
  return prisma.openQuestion.findFirst({
    where: { id, fileUuid, status: "open" },
    select: OPEN_QUESTION_BASE_SELECT,
  });
}

function mapMediaRows(row: OpenQuestionRow): OpenQuestionCoverMedia[] {
  return row.mediaLinks.map((link) => link.media);
}

function mapOpenQuestionSummary(row: OpenQuestionRow): PublicOpenQuestion {
  const mediaRows = mapMediaRows(row);
  const linked = row.individualLinks[0]?.individual ?? null;
  return {
    id: row.id,
    question: row.question,
    details: row.details ?? null,
    createdAtLabel: dateOnlyLabel(row.createdAt),
    createdAtTime: row.createdAt.getTime(),
    individualsCount: row._count.individualLinks,
    familiesCount: row._count.familyLinks,
    eventsCount: row._count.eventLinks,
    mediaCount: row._count.mediaLinks,
    linkedIndividual: linked
      ? {
          id: linked.id,
          fullName: gedcomNameToDisplayName(linked.fullName, linked.xref),
        }
      : null,
    coverSrc: pickOpenQuestionCoverSrc(row.id, mediaRows),
    href: openQuestionHref(row.id),
  };
}

function mapOpenQuestionLinks(row: OpenQuestionRow, viewer: PublicViewer): PublicOpenQuestionLink[] {
  const links: PublicOpenQuestionLink[] = [];

  for (const { individual } of row.individualLinks) {
    const displayName = gedcomNameToDisplayName(individual.fullName, individual.xref);
    const birthYear = individual.birthDate?.year ?? null;
    const restricted = shouldRedactLivingPerson(viewer, individual.isLiving);
    const label = restricted ? formatMinimalLivingLabel(displayName, birthYear) : displayName;
    const profilePath = `/individuals/${encodeURIComponent(individual.id)}`;
    links.push({
      kind: "individual",
      id: individual.id,
      label,
      href: restricted ? buildLoginWallPath(profilePath) : profilePath,
    });
  }

  for (const { family } of row.familyLinks) {
    links.push({
      kind: "family",
      id: family.id,
      label:
        familyPairLabel({
          husbandFullName: family.husband?.fullName,
          wifeFullName: family.wife?.fullName,
          husbandXref: family.husband?.xref,
          wifeXref: family.wife?.xref,
        }) ?? `Family ${family.xref.replace(/^@+|@+$/g, "").trim() || family.xref}`,
      href: `/families/${encodeURIComponent(family.id)}`,
    });
  }

  for (const { event } of row.eventLinks) {
    const title = event.eventLabel?.trim() || eventTitle(event.eventType, event.customType);
    const date = dateLabelFromParts(event.date?.original, event.date?.year);
    links.push({
      kind: "event",
      id: event.id,
      label: date && date !== "Undated" ? `${title} · ${date}` : title,
      href: `/tree/events/${encodeURIComponent(event.id)}`,
    });
  }

  for (const { media } of row.mediaLinks) {
    const hasLivingLinked = isMediaLinkedToAnyLivingPeople(media);
    const privacyRestricted = shouldGateLivingLinkedEntity(viewer, hasLivingLinked);
    const mediaPath = `/media/${encodeURIComponent(media.id)}`;
    links.push({
      kind: "media",
      id: media.id,
      label: mediaLabel(media.title, media.fileRef),
      href: privacyRestricted ? buildLoginWallPath(mediaPath) : mediaPath,
      coverSrc: privacyRestricted ? null : openQuestionMediaRasterUrl(media),
      privacyRestricted,
    });
  }

  for (const { source } of row.sourceLinks) {
    links.push({
      kind: "source",
      id: source.id,
      label: sourceDisplayLabel(source),
      href: `/research/sources#source-${source.id}`,
    });
  }

  for (const { note } of row.noteLinks) {
    links.push({
      kind: "note",
      id: note.id,
      label: notePreview(note.content),
      href: "/archive/notes",
    });
  }

  return links;
}

export async function loadPublicOpenQuestions(): Promise<PublicOpenQuestion[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  const rows = await prisma.openQuestion.findMany({
    where: { fileUuid, status: "open" },
    orderBy: { createdAt: "desc" },
    select: OPEN_QUESTION_BASE_SELECT,
  });

  return rows.map(mapOpenQuestionSummary);
}

export async function loadPublicOpenQuestionById(
  id: string,
  viewer?: PublicViewer,
): Promise<PublicOpenQuestionDetail | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const resolvedViewer = viewer ?? (await resolvePublicViewer());
  const row = await fetchOpenQuestionRow(id, fileUuid);
  if (!row) return null;

  return {
    ...mapOpenQuestionSummary(row),
    links: mapOpenQuestionLinks(row, resolvedViewer),
  };
}
