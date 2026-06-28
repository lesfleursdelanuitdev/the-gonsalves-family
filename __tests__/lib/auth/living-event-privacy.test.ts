import { describe, expect, it } from "vitest";
import {
  isEventLinkedOnlyToLivingPeople,
  shouldGateLivingEventContent,
  type EventLivingLinkInput,
} from "@/lib/auth/living-event-privacy";

const anonymous = { kind: "anonymous" as const };
const authenticated = { kind: "authenticated" as const, user: { id: "u1" } as never };

function eventLinks(overrides: Partial<EventLivingLinkInput> = {}): EventLivingLinkInput {
  return {
    individualEvents: [],
    familyEvents: [],
    ...overrides,
  };
}

describe("living-event-privacy", () => {
  it("treats events with no linked people as public", () => {
    const input = eventLinks();
    expect(isEventLinkedOnlyToLivingPeople(input)).toBe(false);
    expect(shouldGateLivingEventContent(anonymous, input)).toBe(false);
  });

  it("gates anonymous viewers when every participant is living", () => {
    const input = eventLinks({
      individualEvents: [{ individual: { id: "p1", isLiving: true } }],
    });
    expect(isEventLinkedOnlyToLivingPeople(input)).toBe(true);
    expect(shouldGateLivingEventContent(anonymous, input)).toBe(true);
    expect(shouldGateLivingEventContent(authenticated, input)).toBe(false);
  });

  it("does not gate when any participant is deceased", () => {
    const input = eventLinks({
      familyEvents: [
        {
          family: {
            husband: { id: "p1", isLiving: false },
            wife: { id: "p2", isLiving: true },
          },
        },
      ],
    });
    expect(shouldGateLivingEventContent(anonymous, input)).toBe(false);
  });
});
