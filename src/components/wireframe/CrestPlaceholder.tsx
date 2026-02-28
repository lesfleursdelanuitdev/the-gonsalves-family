type CrestPlaceholderProps = {
  size?: "sm" | "lg";
};

export function CrestPlaceholder({ size = "sm" }: CrestPlaceholderProps) {
  const sizeClass = size === "sm" ? "h-10 w-10" : "h-24 w-24";

  return (
    <div
      className={`border border-crest-border bg-crest-bg ${sizeClass}`}
      aria-hidden
    />
  );
}
