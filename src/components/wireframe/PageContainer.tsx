import { NARROW_SECTION_MAX_WIDTH } from "@/constants/layout";

export function PageContainer({
  children,
  narrow,
  fullWidth,
}: {
  children: React.ReactNode;
  /** Journey-strip width cap (list/profile-style pages). */
  narrow?: boolean;
  /** Use full main content width (no max-w-5xl cap). */
  fullWidth?: boolean;
}) {
  const maxWidthClass = narrow || fullWidth ? "" : "max-w-5xl";
  return (
    <div
      className={`mx-auto w-full px-6 py-4 ${maxWidthClass}`}
      style={narrow ? { maxWidth: NARROW_SECTION_MAX_WIDTH } : undefined}
    >
      {children}
    </div>
  );
}
