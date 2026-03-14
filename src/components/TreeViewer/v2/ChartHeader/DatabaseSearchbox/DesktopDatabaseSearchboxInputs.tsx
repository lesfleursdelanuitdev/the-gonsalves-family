"use client";

const inputStyles = {
  background: "rgba(229, 220, 200, 0.55)",
  border: "1px solid #e5dcc8",
  borderRadius: 6,
  color: "var(--tree-text)",
  fontSize: 12,
  padding: "5px 10px",
  outline: "none",
  fontFamily: "inherit",
} as const;

export interface DesktopDatabaseSearchboxInputsProps {
  searchGivenName: string;
  searchLastName: string;
  onSearchGivenNameChange: (v: string) => void;
  onSearchLastNameChange: (v: string) => void;
}

export function DesktopDatabaseSearchboxInputs({
  searchGivenName,
  searchLastName,
  onSearchGivenNameChange,
  onSearchLastNameChange,
}: DesktopDatabaseSearchboxInputsProps) {
  const clearBoth = () => {
    onSearchGivenNameChange("");
    onSearchLastNameChange("");
  };

  return (
    <>
      <input
        value={searchGivenName}
        onChange={(e) => onSearchGivenNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") clearBoth();
        }}
        placeholder="Given name"
        style={{ ...inputStyles, width: 100 }}
      />
      <input
        value={searchLastName}
        onChange={(e) => onSearchLastNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") clearBoth();
        }}
        placeholder="Last name"
        style={{ ...inputStyles, width: 100 }}
      />
    </>
  );
}
