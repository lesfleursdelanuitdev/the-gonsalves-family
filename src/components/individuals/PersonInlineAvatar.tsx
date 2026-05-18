import Image from "next/image";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0]?.toUpperCase() ?? "") : "";
  return (first + last) || "?";
}

/** Small circular avatar for inline rows (cards, lists). */
export function PersonInlineAvatar({
  portraitSrc,
  fullName,
  size = "sm",
}: {
  portraitSrc: string | null;
  fullName: string;
  size?: "sm" | "md" | "lg";
}) {
  const shell =
    size === "lg"
      ? "h-14 w-14 text-base"
      : size === "md"
        ? "h-9 w-9 text-xs"
        : "h-7 w-7 text-[0.6rem]";
  const imageSizes = size === "lg" ? "56px" : size === "md" ? "36px" : "28px";

  if (portraitSrc) {
    return (
      <span
        className={`relative aspect-square shrink-0 overflow-hidden rounded-full border border-border-subtle/90 bg-surface object-cover shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35),0_1px_4px_rgba(40,28,18,0.12)] ring-1 ring-black/[0.04] ${shell}`}
        aria-hidden
      >
        <Image
          src={portraitSrc}
          alt=""
          fill
          className="object-cover object-[50%_20%] sepia-[0.12]"
          sizes={imageSizes}
        />
      </span>
    );
  }

  return (
    <span
      className={`flex aspect-square shrink-0 items-center justify-center rounded-full border border-border-subtle/90 bg-surface-elevated/95 font-heading font-semibold leading-none tracking-[0.03em] text-link shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25),0_1px_4px_rgba(40,28,18,0.08)] ring-1 ring-black/[0.04] ${shell}`}
      aria-hidden
    >
      {initials(fullName)}
    </span>
  );
}
