type PlaceholderBoxProps = {
  children?: React.ReactNode;
  aspectRatio?: string;
  className?: string;
};

export function PlaceholderBox({
  children,
  aspectRatio,
  className = "",
}: PlaceholderBoxProps) {
  return (
    <div
      className={`min-h-24 border border-border bg-surface-2 ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {children}
    </div>
  );
}
