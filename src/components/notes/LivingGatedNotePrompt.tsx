import Link from "next/link";

export function LivingGatedNotePrompt({
  loginHref,
  className = "",
}: {
  loginHref: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-link/15 bg-link-soft-bg/40 px-4 py-3 ${className}`.trim()}>
      <p className="text-sm leading-relaxed text-muted">
        This note relates to one or more living family members. Sign in to view its content.
      </p>
      <Link
        href={loginHref}
        className="mt-2 inline-flex text-sm font-semibold text-link underline-offset-2 hover:underline"
      >
        Sign in to view
      </Link>
    </div>
  );
}
