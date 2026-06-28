import { describe, expect, it } from "vitest";
import {
  collectPeopleLinkedToNote,
  isNoteLinkedOnlyToLivingPeople,
  shouldGateLivingNoteContent,
  type NoteLivingLinkInput,
} from "@/lib/auth/living-note-privacy";

const anonymous = { kind: "anonymous" as const };
const authenticated = { kind: "authenticated" as const, user: { id: "u1" } as never };

function noteLinks(overrides: Partial<NoteLivingLinkInput> = {}): NoteLivingLinkInput {
  return {
    individualNotes: [],
    familyNotes: [],
    ...overrides,
  };
}

describe("living-note-privacy", () => {
  it("treats notes with no linked people as public", () => {
    const input = noteLinks();
    expect(collectPeopleLinkedToNote(input)).toHaveLength(0);
    expect(isNoteLinkedOnlyToLivingPeople([])).toBe(false);
    expect(shouldGateLivingNoteContent(anonymous, input)).toBe(false);
  });

  it("gates anonymous viewers when every linked person is living", () => {
    const input = noteLinks({
      individualNotes: [{ individual: { id: "p1", isLiving: true } }],
    });
    expect(isNoteLinkedOnlyToLivingPeople(collectPeopleLinkedToNote(input))).toBe(true);
    expect(shouldGateLivingNoteContent(anonymous, input)).toBe(true);
    expect(shouldGateLivingNoteContent(authenticated, input)).toBe(false);
  });

  it("does not gate when any linked person is deceased", () => {
    const input = noteLinks({
      familyNotes: [
        {
          family: {
            husband: { id: "p1", isLiving: false },
            wife: { id: "p2", isLiving: true },
          },
        },
      ],
    });
    expect(shouldGateLivingNoteContent(anonymous, input)).toBe(false);
  });
});
