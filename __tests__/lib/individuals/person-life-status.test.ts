import { describe, expect, it } from "vitest";
import {
  MAX_AGE_ASSUMING_LIVING,
  isPersonLiving,
  personLifeStatus,
} from "@/lib/individuals/person-life-status";

describe("personLifeStatus", () => {
  it("treats death on record as deceased", () => {
    expect(personLifeStatus({ birthYear: 1950, deathYear: 2020 }, 2026)).toBe("dead");
  });

  it("treats age over 120 without death as likely deceased", () => {
    const ref = 2026;
    expect(
      personLifeStatus({ birthYear: ref - MAX_AGE_ASSUMING_LIVING - 1, deathYear: null }, ref),
    ).toBe("dead");
  });

  it("treats younger people without death as living", () => {
    expect(personLifeStatus({ birthYear: 2000, deathYear: null }, 2026)).toBe("living");
    expect(isPersonLiving({ birthYear: 2000, deathYear: null }, 2026)).toBe(true);
  });
});
