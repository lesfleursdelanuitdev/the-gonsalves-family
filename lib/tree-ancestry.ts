/**
 * Ancestor and descendant traversal for GEDCOM tree data.
 * Loads parent-child, sibling, and spouse edges; traverses in memory.
 * Results are cached per fileUuid (static until GEDCOM re-import).
 */

import { prisma } from "@/lib/database/prisma";
import {
  getCachedParentChildMaps,
  setCachedParentChildMaps,
  getCachedSiblingMap,
  setCachedSiblingMap,
  getCachedSpouseMap,
  setCachedSpouseMap,
} from "@/lib/tree-cache";

export interface ParentChildMaps {
  childToParents: Map<string, string[]>;
  parentToChildren: Map<string, string[]>;
}

export async function loadParentChildMaps(fileUuid: string): Promise<ParentChildMaps> {
  const cached = getCachedParentChildMaps(fileUuid);
  if (cached) return cached;

  const rows = await prisma.gedcomParentChild.findMany({
    where: { fileUuid },
    select: { parentId: true, childId: true },
  });
  const childToParents = new Map<string, string[]>();
  const parentToChildren = new Map<string, string[]>();
  for (const r of rows) {
    const parents = childToParents.get(r.childId) ?? [];
    if (!parents.includes(r.parentId)) parents.push(r.parentId);
    childToParents.set(r.childId, parents);
    const children = parentToChildren.get(r.parentId) ?? [];
    if (!children.includes(r.childId)) children.push(r.childId);
    parentToChildren.set(r.parentId, children);
  }
  const result = { childToParents, parentToChildren };
  setCachedParentChildMaps(fileUuid, result);
  return result;
}

export async function loadSiblingMap(fileUuid: string): Promise<Map<string, Set<string>>> {
  const cached = getCachedSiblingMap(fileUuid);
  if (cached) return cached;

  const pcRows = await prisma.gedcomParentChild.findMany({
    where: { fileUuid },
    select: { childId: true, familyId: true },
  });
  const familyToChildren = new Map<string, string[]>();
  for (const r of pcRows) {
    if (!r.familyId) continue;
    const kids = familyToChildren.get(r.familyId) ?? [];
    if (!kids.includes(r.childId)) kids.push(r.childId);
    familyToChildren.set(r.familyId, kids);
  }
  const siblingMap = new Map<string, Set<string>>();
  for (const kids of familyToChildren.values()) {
    for (const k of kids) {
      const sibs = siblingMap.get(k) ?? new Set();
      for (const other of kids) if (other !== k) sibs.add(other);
      siblingMap.set(k, sibs);
    }
  }
  setCachedSiblingMap(fileUuid, siblingMap);
  return siblingMap;
}

export async function loadSpouseMap(fileUuid: string): Promise<Map<string, Set<string>>> {
  const cached = getCachedSpouseMap(fileUuid);
  if (cached) return cached;

  const rows = await prisma.gedcomSpouse.findMany({
    where: { fileUuid },
    select: { individualId: true, spouseId: true },
  });
  const map = new Map<string, Set<string>>();
  for (const r of rows) {
    const s = map.get(r.individualId) ?? new Set();
    s.add(r.spouseId);
    map.set(r.individualId, s);
    const s2 = map.get(r.spouseId) ?? new Set();
    s2.add(r.individualId);
    map.set(r.spouseId, s2);
  }
  setCachedSpouseMap(fileUuid, map);
  return map;
}

export interface AncestorOptions {
  includeAuntsUncles?: boolean;
}

export function getAncestorIds(
  startId: string,
  childToParents: Map<string, string[]>,
  maxDepth: number,
  siblingMap?: Map<string, Set<string>>
): Map<number, Set<string>> {
  const result = new Map<number, Set<string>>();
  let current = new Set<string>([startId]);
  const seen = new Set<string>([startId]);
  for (let d = 1; d <= maxDepth; d++) {
    const next = new Set<string>();
    for (const id of current) {
      const parents = childToParents.get(id) ?? [];
      for (const p of parents) {
        if (!seen.has(p)) {
          next.add(p);
          seen.add(p);
        }
        if (siblingMap) {
          const sibs = siblingMap.get(p) ?? new Set();
          for (const s of sibs) {
            if (!seen.has(s)) {
              next.add(s);
              seen.add(s);
            }
          }
        }
      }
    }
    if (next.size > 0) result.set(d, next);
    current = next;
  }
  return result;
}

export interface DescendantOptions {
  includeSpouses?: boolean;
}

export function getDescendantIds(
  startId: string,
  parentToChildren: Map<string, string[]>,
  maxDepth: number,
  spouseMap?: Map<string, Set<string>>
): Map<number, Set<string>> {
  const result = new Map<number, Set<string>>();
  let current = new Set<string>([startId]);
  const seen = new Set<string>([startId]);
  for (let d = 1; d <= maxDepth; d++) {
    const next = new Set<string>();
    for (const id of current) {
      const children = parentToChildren.get(id) ?? [];
      for (const c of children) {
        if (!seen.has(c)) {
          next.add(c);
          seen.add(c);
        }
        if (spouseMap) {
          const spouses = spouseMap.get(c) ?? new Set();
          for (const s of spouses) {
            if (!seen.has(s)) {
              next.add(s);
              seen.add(s);
            }
          }
        }
      }
    }
    if (next.size > 0) result.set(d, next);
    current = next;
  }
  return result;
}
