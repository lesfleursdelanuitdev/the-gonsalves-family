export function Button({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-body inline-block border border-accent bg-primary text-primary-foreground px-4 py-2">
      {children}
    </span>
  );
}
