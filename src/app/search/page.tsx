"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DescendancyPerson } from "@/descendancy-chart";
import { useChartSearch } from "@/descendancy-chart";
import { ArrowLeft } from "lucide-react";

export default function SearchPage() {
  const router = useRouter();
  const {
    searchGivenName,
    setSearchGivenName,
    searchLastName,
    setSearchLastName,
    searchResults,
    searchLoading,
    searchHasMore,
    isSearchFetchingMore,
    fetchNextPage,
  } = useChartSearch();

  const hasQuery = searchGivenName.trim() || searchLastName.trim();

  const handleSelect = (person: DescendancyPerson) => {
    router.push(`/tree?root=${encodeURIComponent(person.id)}`);
  };

  const inputStyles = {
    background: "var(--surface-inset)",
    border: "1px solid var(--tree-border)",
    borderRadius: 6,
    color: "var(--tree-text)",
    fontSize: 16,
    padding: "12px 14px",
    width: "100%" as const,
    outline: "none",
    fontFamily: "var(--font-body-raw), system-ui, sans-serif",
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-bg font-body"
      style={{
        background: "var(--tree-bg)",
        color: "var(--tree-text)",
      }}
    >
      <style>{`
        .search-page-container {
          max-width: 480px;
          margin: 0 auto;
          width: 100%;
          padding: 1rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
      `}</style>
      <header
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--tree-border)",
          background: "var(--tree-surface)",
        }}
      >
        <Link
          href="/tree"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--tree-text)",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={18} />
          Back to tree
        </Link>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "var(--font-heading-raw), serif",
            color: "var(--tree-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Search the database
        </span>
        <span style={{ width: 24 }} />
      </header>

      <div className="search-page-container">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <input
            autoFocus
            value={searchGivenName}
            onChange={(e) => setSearchGivenName(e.target.value)}
            placeholder="Given name"
            style={inputStyles}
            aria-label="Given name"
          />
          <input
            value={searchLastName}
            onChange={(e) => setSearchLastName(e.target.value)}
            placeholder="Last name"
            style={inputStyles}
            aria-label="Last name"
          />
        </div>

        {hasQuery && (
          <div
            style={{
              marginTop: 20,
              borderRadius: 8,
              border: "1px solid var(--tree-border)",
              overflow: "hidden",
              background: "var(--tree-panel-bg)",
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {searchLoading ? (
              <div
                style={{
                  padding: "16px 20px",
                  color: "var(--tree-text-muted)",
                  fontSize: 14,
                }}
              >
                Searching…
              </div>
            ) : searchResults.length === 0 ? (
              <div
                style={{
                  padding: "16px 20px",
                  color: "var(--tree-text-muted)",
                  fontSize: 14,
                }}
              >
                No results
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                {searchResults.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      cursor: "pointer",
                      color: "var(--tree-text)",
                      fontSize: 14,
                      border: "none",
                      borderBottom:
                        i === searchResults.length - 1
                          ? "none"
                          : "1px solid var(--tree-border)",
                      background: "transparent",
                      textAlign: "left",
                      transition: "background 0.1s",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--hover-overlay)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {p.firstName} {p.lastName}
                    </span>
                    {p.birthYear != null && (
                      <span
                        style={{
                          color: "var(--tree-text-muted)",
                          fontSize: 12,
                        }}
                      >
                        b. {p.birthYear}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {searchHasMore && (
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                disabled={isSearchFetchingMore}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  borderTop: "1px solid var(--tree-border)",
                  background: "var(--surface-inset)",
                  color: "var(--tree-text-muted)",
                  fontSize: 13,
                  cursor: isSearchFetchingMore ? "wait" : "pointer",
                }}
              >
                {isSearchFetchingMore ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        )}

        {!hasQuery && (
          <p
            style={{
              marginTop: 24,
              color: "var(--tree-text-muted)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Enter a given name and/or last name to search the family database.
          </p>
        )}
      </div>
    </div>
  );
}
