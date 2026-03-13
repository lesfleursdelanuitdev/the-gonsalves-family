export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 12"
      className={`h-12 w-8 shrink-0 ${className ?? ""}`}
      aria-hidden
    >
      <path
        className="timeline-arrow"
        d="M0 6 L20 6"
        fill="none"
        strokeWidth={1}
        strokeLinecap="round"
      />
      <path
        className="timeline-arrow"
        d="M20 6 L16 1 M20 6 L16 11"
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
