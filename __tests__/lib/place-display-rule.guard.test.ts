import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fullPlaceLabel } from "@ligneous/gedcom-events";

/**
 * Enforces the workspace "Full place names" rule (see CLAUDE.md):
 * places must always be shown in full, never truncated to a single segment.
 *
 * 1. Smoke-tests the canonical formatter so the shared wiring stays correct.
 * 2. Statically scans genealogy source for banned per-segment truncation applied
 *    to place values (e.g. `birthPlace.split(",").pop()`).
 */

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

// Dirs that render places to users. Keep in sync with the genealogy stack.
const SCAN_DIRS = [
  path.join(REPO_ROOT, "the-gonsalves-family", "src"),
  path.join(REPO_ROOT, "the-gonsalves-family", "lib"),
  path.join(REPO_ROOT, "packages", "ligneous-timeline-view", "src"),
  path.join(REPO_ROOT, "packages", "ligneous-album-generated-queries", "src"),
];

// Broader set for the select-coupling check (anywhere a resolvedPlace can be selected).
const COUPLING_DIRS = [
  path.join(REPO_ROOT, "the-gonsalves-family", "src"),
  path.join(REPO_ROOT, "the-gonsalves-family", "lib"),
  path.join(REPO_ROOT, "the-gonsalves-family-admin", "src"),
  path.join(REPO_ROOT, "the-gonsalves-family-admin", "lib"),
  path.join(REPO_ROOT, "the-gonsalves-family-admin", "scripts"),
  path.join(REPO_ROOT, "packages"),
];

// Matches a `resolvedPlace: { select: { ...flat fields... } }` block. resolvedPlace
// selects are flat (no nested objects), so [^}] up to the first close brace is safe.
const RESOLVED_SELECT_BLOCK = /resolvedPlace\s*:\s*\{\s*select\s*:\s*\{([^}]*)\}/g;

// `<something>place<...>.split(",")` followed by [0] / .pop() / .shift():
// taking a single segment off a place string is the truncation we ban.
const BANNED = /place[A-Za-z]*\s*(?:\?\.|\.)?\s*split\(\s*["']\s*,\s*["']\s*\)\s*(?:\[\s*0\s*\]|\.\s*(?:pop|shift)\s*\()/i;

function walk(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // dir may not exist in every checkout
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out = out.concat(walk(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

describe("fullPlaceLabel (canonical formatter)", () => {
  it("returns the full place, not a single segment", () => {
    const label = fullPlaceLabel({
      original: "Concord, California, United States",
      name: "Concord",
      state: "California",
      country: "United States",
    });
    expect(label).toBe("Concord, California, United States");
    expect(label).not.toBe("Concord");
    expect(label).not.toBe("United States");
  });

  it("uses the curated resolved name only when status is active", () => {
    const base = {
      original: "Concord, California, United States",
      name: "Concord",
      state: "California",
      country: "United States",
    };
    expect(
      fullPlaceLabel({ ...base, resolvedLink: { resolvedPlace: { displayName: "Curated Name", status: "active" } } }),
    ).toBe("Curated Name");
    // needs_review / deprecated / missing status must NOT override the raw full place
    for (const status of ["needs_review", "deprecated", undefined]) {
      expect(
        fullPlaceLabel({ ...base, resolvedLink: { resolvedPlace: { displayName: "Curated Name", status } } }),
      ).toBe("Concord, California, United States");
    }
  });
});

describe("resolvedPlace selects must also select status", () => {
  it("every resolvedPlace { select } that picks displayName also picks status", () => {
    const offenders: string[] = [];
    const seen = new Set<string>();
    for (const dir of COUPLING_DIRS) {
      for (const file of walk(dir)) {
        if (seen.has(file)) continue;
        seen.add(file);
        const text = readFileSync(file, "utf8");
        let m: RegExpExecArray | null;
        RESOLVED_SELECT_BLOCK.lastIndex = 0;
        while ((m = RESOLVED_SELECT_BLOCK.exec(text)) !== null) {
          const inner = m[1];
          if (/\bdisplayName\b/.test(inner) && !/\bstatus\b/.test(inner)) {
            offenders.push(`${path.relative(REPO_ROOT, file)}  →  resolvedPlace select picks displayName but not status`);
          }
        }
      }
    }
    expect(
      offenders,
      `fullPlaceLabel only trusts a resolved name when status === "active", so any ` +
        `resolvedPlace select that fetches displayName must also fetch status ` +
        `(see CLAUDE.md "Resolved place names"):\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});

describe("no place-name truncation in genealogy source", () => {
  it("contains no banned per-segment place truncation", () => {
    const offenders: string[] = [];
    for (const dir of SCAN_DIRS) {
      for (const file of walk(dir)) {
        const text = readFileSync(file, "utf8");
        text.split(/\r?\n/).forEach((line, i) => {
          if (BANNED.test(line)) {
            offenders.push(`${path.relative(REPO_ROOT, file)}:${i + 1}  ${line.trim()}`);
          }
        });
      }
    }
    expect(
      offenders,
      `Place values must be shown in full (see CLAUDE.md "Full place names"). ` +
        `Use fullPlaceLabel from @ligneous/gedcom-events instead of truncating:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
