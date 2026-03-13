"use client";

import { useMemo, useState, useEffect } from "react";
import { useTreeIndividualsSearchInfinite } from "@/hooks/useTreeData";
import type { DescendancyPerson } from "../types";

const DEBOUNCE_MS = 300;

export function useChartSearch() {
  const [searchGivenName, setSearchGivenName] = useState("");
  const [searchLastName, setSearchLastName] = useState("");
  const [debouncedGivenName, setDebouncedGivenName] = useState("");
  const [debouncedLastName, setDebouncedLastName] = useState("");

  const trimmedGiven = searchGivenName.trim();
  const trimmedLast = searchLastName.trim();
  useEffect(() => {
    const t = setTimeout(() => setDebouncedGivenName(trimmedGiven), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [trimmedGiven]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLastName(trimmedLast), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [trimmedLast]);

  const hasSearchCriteria =
    debouncedGivenName.length > 0 || debouncedLastName.length > 0;
  const {
    data: searchPagesData,
    isFetching: isSearchFetching,
    isFetchingNextPage: isSearchFetchingMore,
    hasNextPage: searchHasMore,
    fetchNextPage: searchFetchNextPage,
  } = useTreeIndividualsSearchInfinite({
    givenName: debouncedGivenName,
    lastName: debouncedLastName,
    limit: 10,
    enabled: hasSearchCriteria,
  });

  const searchResults = useMemo((): DescendancyPerson[] => {
    if (!hasSearchCriteria || !searchPagesData?.pages) return [];
    const individuals = searchPagesData.pages.flatMap((p) => p.individuals);
    return individuals.map((r) => ({
      id: r.xref,
      firstName: r.names.givenNames.join(" ") || "",
      lastName: r.names.lastName ?? "",
      birthYear: null,
      deathYear: null,
    }));
  }, [hasSearchCriteria, searchPagesData]);

  const searchPendingDebounce =
    trimmedGiven !== debouncedGivenName || trimmedLast !== debouncedLastName;
  const searchLoading = isSearchFetching || searchPendingDebounce;

  return {
    searchGivenName,
    setSearchGivenName,
    searchLastName,
    setSearchLastName,
    searchResults,
    searchLoading,
    searchHasMore: searchHasMore ?? false,
    isSearchFetchingMore: isSearchFetchingMore,
    fetchNextPage: searchFetchNextPage,
  };
}
