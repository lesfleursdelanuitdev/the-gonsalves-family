"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type {
  TreeIndividualSummary,
  TreeIndividual,
  TreeIndividualWithDepth,
  TreeFamily,
  TreeEvent,
  TreeDate,
  TreePlace,
  TreeSurname,
  TreeGivenName,
  AncestorsResponse,
  DescendantsResponse,
  UpcomingEventsResponse,
} from "@/types/tree";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function useTreeIndividuals(options?: {
  q?: string;
  givenName?: string;
  lastName?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const params = new URLSearchParams();
  if (options?.q != null && options.q.trim() !== "") params.set("q", options.q.trim());
  if (options?.givenName != null && options.givenName.trim() !== "") params.set("givenName", options.givenName.trim());
  if (options?.lastName != null && options.lastName.trim() !== "") params.set("lastName", options.lastName.trim());
  if (options?.limit != null) params.set("limit", String(options.limit));
  const qs = params.toString();
  const url = `/api/tree/individuals${qs ? `?${qs}` : ""}`;
  return useQuery({
    queryKey: ["tree", "individuals", options?.q ?? null, options?.givenName ?? null, options?.lastName ?? null, options?.limit ?? null],
    queryFn: () =>
      fetchJson<{ individuals: TreeIndividualSummary[] }>(url).then(
        (r) => r.individuals
      ),
    enabled: options?.enabled !== false,
  });
}

/** Response shape when API is called with limit (and optionally offset) */
export interface TreeIndividualsPage {
  individuals: TreeIndividualSummary[];
  hasMore: boolean;
  nextOffset: number;
}

/** Infinite query for search: givenName/lastName, load more pages. */
export function useTreeIndividualsSearchInfinite(options: {
  givenName: string;
  lastName: string;
  limit?: number;
  enabled?: boolean;
}) {
  const limit = options.limit ?? 10;
  const enabled = options.enabled !== false && (options.givenName.trim() !== "" || options.lastName.trim() !== "");

  return useInfiniteQuery({
    queryKey: ["tree", "individuals", "search", options.givenName, options.lastName, limit],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (options.givenName.trim() !== "") params.set("givenName", options.givenName.trim());
      if (options.lastName.trim() !== "") params.set("lastName", options.lastName.trim());
      params.set("limit", String(limit));
      params.set("offset", String(pageParam as number));
      const url = `/api/tree/individuals?${params.toString()}`;
      const res = await fetchJson<{ individuals: TreeIndividualSummary[]; hasMore: boolean; nextOffset: number }>(url);
      return res;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
    enabled,
  });
}

export function useTreeFamilies() {
  return useQuery({
    queryKey: ["tree", "families"],
    queryFn: () =>
      fetchJson<{ families: TreeFamily[] }>("/api/tree/families").then(
        (r) => r.families
      ),
  });
}

export function useTreeEvents() {
  return useQuery({
    queryKey: ["tree", "events"],
    queryFn: () =>
      fetchJson<{ events: TreeEvent[] }>("/api/tree/events").then(
        (r) => r.events
      ),
  });
}

export function useTreeUpcomingEvents() {
  return useQuery({
    queryKey: ["tree", "events", "upcoming"],
    queryFn: () =>
      fetchJson<UpcomingEventsResponse>("/api/tree/events/upcoming"),
  });
}

export function useTreeDates() {
  return useQuery({
    queryKey: ["tree", "dates"],
    queryFn: () =>
      fetchJson<{ dates: TreeDate[] }>("/api/tree/dates").then((r) => r.dates),
  });
}

export function useTreePlaces() {
  return useQuery({
    queryKey: ["tree", "places"],
    queryFn: () =>
      fetchJson<{ places: TreePlace[] }>("/api/tree/places").then(
        (r) => r.places
      ),
  });
}

export function useTreeSurnames() {
  return useQuery({
    queryKey: ["tree", "surnames"],
    queryFn: () =>
      fetchJson<{ surnames: TreeSurname[] }>("/api/tree/surnames").then(
        (r) => r.surnames
      ),
  });
}

export function useTreeGivenNames() {
  return useQuery({
    queryKey: ["tree", "givenNames"],
    queryFn: () =>
      fetchJson<{ givenNames: TreeGivenName[] }>(
        "/api/tree/given-names"
      ).then((r) => r.givenNames),
  });
}

export function useTreeRandomIndividual() {
  return useQuery({
    queryKey: ["tree", "random", "individual"],
    queryFn: () =>
      fetchJson<{ individual: TreeIndividual | null }>("/api/tree/random/individual").then(
        (r) => r.individual
      ),
  });
}

export function useTreeRandomFamily() {
  return useQuery({
    queryKey: ["tree", "random", "family"],
    queryFn: () =>
      fetchJson<{ family: TreeFamily | null }>("/api/tree/random/family").then((r) => r.family),
  });
}

export function useTreeRandomPlace() {
  return useQuery({
    queryKey: ["tree", "random", "place"],
    queryFn: () =>
      fetchJson<{ place: TreePlace | null }>("/api/tree/random/place").then((r) => r.place),
  });
}

export function useTreeRandomSurname() {
  return useQuery({
    queryKey: ["tree", "random", "surname"],
    queryFn: () =>
      fetchJson<{ surname: TreeSurname | null }>("/api/tree/random/surname").then(
        (r) => r.surname
      ),
  });
}

export function useTreeAncestors(
  xref: string,
  options?: { depth?: number; includeSelf?: boolean; includeAuntsUncles?: boolean }
) {
  const params = new URLSearchParams();
  if (options?.depth != null) params.set("depth", String(options.depth));
  if (options?.includeSelf) params.set("includeSelf", "true");
  if (options?.includeAuntsUncles) params.set("includeAuntsUncles", "true");
  const qs = params.toString();
  const url = `/api/tree/individuals/${encodeURIComponent(xref)}/ancestors${qs ? `?${qs}` : ""}`;
  return useQuery({
    queryKey: ["tree", "ancestors", xref, options],
    queryFn: () =>
      fetchJson<{ ancestors: TreeIndividualWithDepth[]; meta: { total: number; maxDepth: number } }>(
        url
      ),
    enabled: !!xref,
  });
}

export function useTreeDescendants(
  xref: string,
  options?: { depth?: number; includeSelf?: boolean; includeSpouses?: boolean }
) {
  const params = new URLSearchParams();
  if (options?.depth != null) params.set("depth", String(options.depth));
  if (options?.includeSelf) params.set("includeSelf", "true");
  if (options?.includeSpouses) params.set("includeSpouses", "true");
  const qs = params.toString();
  const url = `/api/tree/individuals/${encodeURIComponent(xref)}/descendants${qs ? `?${qs}` : ""}`;
  return useQuery({
    queryKey: ["tree", "descendants", xref, options],
    queryFn: () =>
      fetchJson<{
        descendants: TreeIndividualWithDepth[];
        meta: { total: number; maxDepth: number };
      }>(url),
    enabled: !!xref,
  });
}
