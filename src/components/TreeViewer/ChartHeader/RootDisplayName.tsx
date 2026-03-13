"use client";

export interface RootDisplayNameProps {
  rootDisplayName?: string | null;
}

export function RootDisplayName({ rootDisplayName }: RootDisplayNameProps) {
  return (
    <span
      style={{
        marginLeft: "auto",
        fontSize: 8,
        fontFamily: "Inter, sans-serif",
        textTransform: "uppercase",
        color: "var(--tree-text-muted)",
        letterSpacing: "0.04em",
      }}
    >
      {rootDisplayName ?? "—"}
    </span>
  );
}
