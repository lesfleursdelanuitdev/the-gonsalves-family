"use client";

export interface FamilyTreeLoadingProps {
  isLoading: boolean;
  /** Shown when not loading and no builder (error case). Default: "Unable to load tree. Check your connection or try another root." */
  message?: string;
}

const defaultErrorMessage =
  "Unable to load tree. Check your connection or try another root.";

export function FamilyTreeLoading({
  isLoading,
  message = defaultErrorMessage,
}: FamilyTreeLoadingProps) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--tree-bg)",
        color: "var(--tree-fg)",
      }}
      aria-live="polite"
    >
      {isLoading ? (
        <span>Loading tree…</span>
      ) : (
        <span>{message}</span>
      )}
    </div>
  );
}
