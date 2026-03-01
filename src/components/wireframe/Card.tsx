type CardProps = {
  title?: string;
  children?: React.ReactNode;
};

export function Card({ title, children }: CardProps) {
  return (
    <div className="border border-border bg-surface-2 p-4">
      {title && <div className="font-heading mb-2 font-medium text-heading">{title}</div>}
      {children}
    </div>
  );
}
