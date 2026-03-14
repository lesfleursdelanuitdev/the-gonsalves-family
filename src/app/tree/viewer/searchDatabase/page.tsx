"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DescendancyPerson } from "@/descendancy-chart";
import { useChartSearch } from "@/descendancy-chart";
import { ArrowLeft } from "lucide-react";

const TREE_VIEWER_PATH = "/tree/viewer";

function SearchDatabaseContent() {
  const router = useRouter();
  const {
    searchGivenName,
    setSearchGivenName,
    searchLastName,
    setSearchLastName,
    searchResults,
    searchLoading,
  } = useChartSearch();

  const hasQuery = searchGivenName.trim() || searchLastName.trim();

  const handleSelect = (person: DescendancyPerson) => {
    const rootName = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || person.id;
    const params = new URLSearchParams({
      root: person.id,
      loadSavedHistory: "true",
      rootName,
    });
    router.push(`${TREE_VIEWER_PATH}?${params.toString()}`);
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
          href={TREE_VIEWER_PATH}
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
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
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

export default function SearchDatabasePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex flex-col bg-bg font-body"
          style={{ background: "var(--tree-bg)", color: "var(--tree-text)" }}
        >
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
              href={TREE_VIEWER_PATH}
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
            <span style={{ width: 24 }} />
          </header>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <span style={{ color: "var(--tree-text-muted)", fontSize: 14 }}>Loading…</span>
          </div>
        </div>
      }
    >
      <SearchDatabaseContent />
    </Suspense>
  );
}
