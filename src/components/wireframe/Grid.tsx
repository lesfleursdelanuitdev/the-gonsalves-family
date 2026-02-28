type GridProps = {
  cols: 2 | 3 | 4 | 6;
  children: React.ReactNode;
};

export function Grid({ cols, children }: GridProps) {
  const colsClass =
    cols === 2
      ? "grid-cols-2"
      : cols === 3
        ? "grid-cols-3"
        : cols === 4
          ? "grid-cols-4"
          : "grid-cols-6";

  return <div className={`grid gap-4 ${colsClass}`}>{children}</div>;
}
