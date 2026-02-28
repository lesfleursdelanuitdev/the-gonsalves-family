export function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className ? `py-12 ${className}` : "py-12"}>
      {children}
    </section>
  );
}
