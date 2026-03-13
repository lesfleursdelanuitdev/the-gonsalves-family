import { NARROW_SECTION_MAX_WIDTH } from "@/constants/layout";

export function PageContainer({
  children,
  narrow,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full px-6 py-4 ${narrow ? "" : "max-w-5xl"}`}
      style={narrow ? { maxWidth: NARROW_SECTION_MAX_WIDTH } : undefined}
    >
      {children}
    </div>
  );
}
