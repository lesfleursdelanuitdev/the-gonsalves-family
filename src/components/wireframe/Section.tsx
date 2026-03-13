export function Section({
  children,
  className,
  noPadding,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  style?: React.CSSProperties;
}) {
  const baseClass = noPadding ? "" : "py-12";
  const mergedClass = [baseClass, className].filter(Boolean).join(" ");
  return (
    <section className={mergedClass || undefined} style={style}>
      {children}
    </section>
  );
}
