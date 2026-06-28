import {
  shouldGateLivingNoteContent,
  type NoteLivingLinkInput,
} from "@/lib/auth/living-note-privacy";
import { buildLoginWallPath } from "@/lib/auth/public-viewer";
import type { PublicViewer } from "@/lib/auth/public-viewer-context";
import { prisma } from "@/lib/database/prisma";
import { NOTE_LIVING_LINK_SELECT } from "@/lib/auth/living-note-privacy";
import type { PublicProfileNote } from "@/lib/notes/public-profile-note";

type NoteContentRow = {
  id: string;
  xref: string | null;
  content: string;
};

export function mapPublicProfileNoteWithLivingPrivacy(
  viewer: PublicViewer,
  note: NoteContentRow & NoteLivingLinkInput,
  loginPath: string,
): PublicProfileNote {
  const privacyRestricted = shouldGateLivingNoteContent(viewer, note);
  return {
    id: note.id,
    xref: note.xref,
    content: privacyRestricted ? "" : note.content,
    privacyRestricted,
    loginHref: privacyRestricted ? buildLoginWallPath(loginPath) : null,
  };
}

export async function loadNoteLivingLinksByIds(
  fileUuid: string,
  noteIds: string[],
): Promise<Map<string, NoteLivingLinkInput>> {
  if (noteIds.length === 0) return new Map();

  const rows = await prisma.gedcomNote.findMany({
    where: { fileUuid, id: { in: noteIds } },
    select: {
      id: true,
      ...NOTE_LIVING_LINK_SELECT,
    },
  });

  return new Map(rows.map((row) => [row.id, row]));
}

export async function mapNoteRowsWithLivingPrivacy(
  viewer: PublicViewer,
  fileUuid: string,
  rows: NoteContentRow[],
  loginPath: string,
): Promise<PublicProfileNote[]> {
  if (rows.length === 0) return [];

  const linksById = await loadNoteLivingLinksByIds(
    fileUuid,
    rows.map((row) => row.id),
  );

  return rows.map((row) =>
    mapPublicProfileNoteWithLivingPrivacy(
      viewer,
      {
        ...row,
        ...(linksById.get(row.id) ?? { individualNotes: [], familyNotes: [] }),
      },
      loginPath,
    ),
  );
}
