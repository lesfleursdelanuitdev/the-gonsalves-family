/**
 * In-memory cache for tree data.
 * Parent-child, sibling, and spouse maps are static per file - they only change on GEDCOM re-import.
 * Cache survives across requests in long-running processes (dev server, Node server).
 */

export interface ParentChildMaps {
  childToParents: Map<string, string[]>;
  parentToChildren: Map<string, string[]>;
}

const globalForCache = globalThis as unknown as {
  treeCache: {
    fileUuid: string | null | undefined;
    parentChild: Map<string, ParentChildMaps>;
    sibling: Map<string, Map<string, Set<string>>>;
    spouse: Map<string, Map<string, Set<string>>>;
  };
};

function getCache() {
  if (!globalForCache.treeCache) {
    globalForCache.treeCache = {
      fileUuid: undefined,
      parentChild: new Map(),
      sibling: new Map(),
      spouse: new Map(),
    };
  }
  return globalForCache.treeCache;
}

export function getCachedFileUuid(): string | null | undefined {
  return getCache().fileUuid;
}

export function setCachedFileUuid(uuid: string | null): void {
  getCache().fileUuid = uuid;
}

export function getCachedParentChildMaps(fileUuid: string): ParentChildMaps | undefined {
  return getCache().parentChild.get(fileUuid);
}

export function setCachedParentChildMaps(fileUuid: string, maps: ParentChildMaps): void {
  getCache().parentChild.set(fileUuid, maps);
}

export function getCachedSiblingMap(fileUuid: string): Map<string, Set<string>> | undefined {
  return getCache().sibling.get(fileUuid);
}

export function setCachedSiblingMap(
  fileUuid: string,
  map: Map<string, Set<string>>
): void {
  getCache().sibling.set(fileUuid, map);
}

export function getCachedSpouseMap(fileUuid: string): Map<string, Set<string>> | undefined {
  return getCache().spouse.get(fileUuid);
}

export function setCachedSpouseMap(
  fileUuid: string,
  map: Map<string, Set<string>>
): void {
  getCache().spouse.set(fileUuid, map);
}
