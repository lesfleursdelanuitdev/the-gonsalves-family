export function TextBlock({ children }: { children: React.ReactNode }) {
  return <p className="font-body mb-4 max-w-2xl leading-relaxed text-text">{children}</p>;
}
