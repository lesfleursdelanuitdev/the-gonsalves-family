export function Section({
  id,
  children,
  className,
  noPadding,
  style,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  style?: React.CSSProperties;
}) {
  const baseClass = noPadding ? "" : "py-12";
  const mergedClass = [baseClass, className].filter(Boolean).join(" ");
  return (
    <section id={id} className={mergedClass || undefined} style={style}>
      {children}
    </section>
  );
}
