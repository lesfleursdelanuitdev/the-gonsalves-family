"use client";

import { useCallback, useState } from "react";
import type { FamiliesAsChildResponse, FamiliesAsSpouseResponse } from "../PersonDetailOverlay/types";
import { normalizeGedcomXref } from "../PersonDetailOverlay/utils";
import type { PedigreeRootSiblingNode } from "@/components/DescendancyChart/FamilyTreeNodes";

export type LoadFamiliesAsChildFn = (xref: string) => Promise<FamiliesAsChildResponse | null>;
export type LoadFamiliesAsSpouseFn = (xref: string) => Promise<FamiliesAsSpouseResponse | null>;

interface PedigreeRootSiblingsState {
  forPersonId: string;
  siblings: PedigreeRootSiblingNode[];
}

interface PedigreeRootChildrenState {
  forPersonId: string;
  children: PedigreeRootSiblingNode[];
}

export interface UsePedigreeRootExpansionParams {
  allowsPedigreeRootExpansion: boolean;
  effectiveRootId: string;
  loadFamiliesAsChild: LoadFamiliesAsChildFn;
  loadFamiliesAsSpouse: LoadFamiliesAsSpouseFn;
}

function splitDisplayName(name: string | null | undefined): { firstName: string; lastName: string } {
  const text = (name ?? "").trim();
  if (!text) return { firstName: "Unknown", lastName: "" };
  const parts = text.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1]! };
}

export function usePedigreeRootExpansion({
  allowsPedigreeRootExpansion,
  effectiveRootId,
  loadFamiliesAsChild,
  loadFamiliesAsSpouse,
}: UsePedigreeRootExpansionParams) {
  const [pedigreeRootSiblings, setPedigreeRootSiblings] = useState<PedigreeRootSiblingsState | null>(null);
  const [pedigreeRootChildren, setPedigreeRootChildren] = useState<PedigreeRootChildrenState | null>(null);
  const activeSiblingsState =
    allowsPedigreeRootExpansion &&
    pedigreeRootSiblings &&
    normalizeGedcomXref(pedigreeRootSiblings.forPersonId) === normalizeGedcomXref(effectiveRootId)
      ? pedigreeRootSiblings
      : null;
  const activeChildrenState =
    allowsPedigreeRootExpansion &&
    pedigreeRootChildren &&
    normalizeGedcomXref(pedigreeRootChildren.forPersonId) === normalizeGedcomXref(effectiveRootId)
      ? pedigreeRootChildren
      : null;

  const togglePedigreeRootSiblings = useCallback(
    async (personId: string) => {
      const norm = normalizeGedcomXref(personId);
      if (!norm || !allowsPedigreeRootExpansion) return;
      if (normalizeGedcomXref(effectiveRootId) !== norm) return;
      if (activeSiblingsState && normalizeGedcomXref(activeSiblingsState.forPersonId) === norm) {
        setPedigreeRootSiblings(null);
        return;
      }
      const json = await loadFamiliesAsChild(norm);
      if (!json) return;
      const families = json.familiesOfOrigin ?? [];
      if (families.length === 0) {
        setPedigreeRootSiblings(null);
        return;
      }
      const birthFamily =
        families.find((f) => String(f.parentsLabel ?? "").toLowerCase().includes("birth")) ??
        families[0]!;
      const siblings = (birthFamily.children ?? [])
        .filter((c) => normalizeGedcomXref(c.xref) !== norm)
        .map((c) => {
          const parsed = splitDisplayName(c.name);
          return {
            xref: c.xref,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            gender: c.gender ?? null,
          } satisfies PedigreeRootSiblingNode;
        });
      setPedigreeRootSiblings({ forPersonId: norm, siblings });
    },
    [allowsPedigreeRootExpansion, effectiveRootId, loadFamiliesAsChild, activeSiblingsState]
  );

  const togglePedigreeRootChildren = useCallback(
    async (personId: string) => {
      const norm = normalizeGedcomXref(personId);
      if (!norm || !allowsPedigreeRootExpansion) return;
      if (normalizeGedcomXref(effectiveRootId) !== norm) return;
      if (activeChildrenState && normalizeGedcomXref(activeChildrenState.forPersonId) === norm) {
        setPedigreeRootChildren(null);
        return;
      }
      const json = await loadFamiliesAsSpouse(norm);
      if (!json) return;
      const seen = new Set<string>();
      const children: PedigreeRootSiblingNode[] = [];
      for (const fam of json.familiesAsSpouse ?? []) {
        for (const child of fam.children ?? []) {
          const cx = normalizeGedcomXref(child.xref);
          if (!cx || seen.has(cx)) continue;
          seen.add(cx);
          const parsed = splitDisplayName(child.name);
          children.push({
            xref: cx,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            gender: child.gender ?? null,
          });
        }
      }
      setPedigreeRootChildren({ forPersonId: norm, children });
    },
    [allowsPedigreeRootExpansion, effectiveRootId, loadFamiliesAsSpouse, activeChildrenState]
  );

  return {
    togglePedigreeRootSiblings,
    togglePedigreeRootChildren,
    pedigreeRootSiblingsForViewport: activeSiblingsState ? activeSiblingsState.siblings : null,
    pedigreeRootChildrenForViewport: activeChildrenState ? activeChildrenState.children : null,
  };
}
