import type { PublicViewer } from "@/lib/auth/public-viewer";
import { isAuthenticatedViewer } from "@/lib/auth/public-viewer";

export type NoteLinkedPerson = {
  id: string;
  isLiving: boolean;
};

export type NoteLivingLinkInput = {
  individualNotes: Array<{ individual: NoteLinkedPerson | null }>;
  familyNotes: Array<{
    family: {
      husband: NoteLinkedPerson | null;
      wife: NoteLinkedPerson | null;
    } | null;
  }>;
};

export const NOTE_LIVING_LINK_SELECT = {
  individualNotes: {
    select: {
      individual: { select: { id: true, isLiving: true } },
    },
  },
  familyNotes: {
    select: {
      family: {
        select: {
          husband: { select: { id: true, isLiving: true } },
          wife: { select: { id: true, isLiving: true } },
        },
      },
    },
  },
} as const;

const EMPTY_NOTE_LIVING_LINKS: NoteLivingLinkInput = {
  individualNotes: [],
  familyNotes: [],
};

export function emptyNoteLivingLinks(): NoteLivingLinkInput {
  return EMPTY_NOTE_LIVING_LINKS;
}

export function collectPeopleLinkedToNote(input: NoteLivingLinkInput): NoteLinkedPerson[] {
  const byId = new Map<string, NoteLinkedPerson>();
  const add = (person: NoteLinkedPerson | null | undefined) => {
    if (!person?.id || byId.has(person.id)) return;
    byId.set(person.id, person);
  };

  for (const link of input.individualNotes) add(link.individual);
  for (const link of input.familyNotes) {
    add(link.family?.husband ?? null);
    add(link.family?.wife ?? null);
  }

  return [...byId.values()];
}

/** True when the note has at least one linked person and every linked person is living. */
export function isNoteLinkedOnlyToLivingPeople(people: NoteLinkedPerson[]): boolean {
  if (people.length === 0) return false;
  return people.every((person) => person.isLiving);
}

export function shouldGateLivingNoteContent(viewer: PublicViewer, input: NoteLivingLinkInput): boolean {
  if (isAuthenticatedViewer(viewer)) return false;
  return isNoteLinkedOnlyToLivingPeople(collectPeopleLinkedToNote(input));
}
