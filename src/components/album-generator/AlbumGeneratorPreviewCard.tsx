import Image from "next/image";
import { cn } from "@/lib/utils";

export type AlbumGeneratorPreview = {
  title: string;
  photoCount: number;
  coverSrc: string;
  tags: string[];
  /** Sample card before the visitor completes source selection */
  isAwaitingSelection?: boolean;
};

export function AlbumGeneratorPreviewCard({
  preview,
  variant = "default",
}: {
  preview: AlbumGeneratorPreview;
  variant?: "default" | "compact";
}) {
  const isCompact = variant === "compact";
  const awaiting = Boolean(preview.isAwaitingSelection);

  return (
    <article
      className={cn(
        "group min-w-0 max-w-full overflow-hidden rounded-2xl border bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]",
        awaiting
          ? "border-border-subtle/90 ring-1 ring-black/[0.04] [box-shadow:0_8px_28px_rgba(60,45,25,0.07),inset_0_1px_0_rgba(255,255,255,0.45)]"
          : "border-border/80",
        isCompact ? "max-w-md" : "",
      )}
    >
      <div className={`relative max-w-full overflow-hidden ${isCompact ? "aspect-[4/3]" : "aspect-[16/10]"}`}>
        <Image
          src={preview.coverSrc}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes={isCompact ? "(max-width:768px) 100vw, 28rem" : "(max-width:768px) 100vw, 42rem"}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-black/5 to-transparent" />
        {awaiting ? (
          <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-3 sm:p-4">
            <span className="rounded-full border border-white/50 bg-[rgba(255,252,245,0.55)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-heading shadow-sm backdrop-blur-md [-webkit-backdrop-filter:blur(12px)] [backdrop-filter:blur(12px)]">
              Sample
            </span>
          </div>
        ) : null}
      </div>
      <div className="min-w-0 space-y-3 p-4 sm:p-5">
        <h3 className="break-words font-heading text-xl font-semibold leading-tight text-heading text-balance sm:text-2xl">
          {preview.title}
        </h3>
        <p className="text-sm text-muted">
          {awaiting ? (
            <>
              Pick a source type and focus above—we&apos;ll suggest a title, cover, and photo count from the
              tree.
            </>
          ) : (
            <>
              About <span className="font-medium text-heading">{preview.photoCount}</span> photos suggested from
              the tree
            </>
          )}
        </p>
        <div className="flex min-w-0 flex-wrap gap-2">
          {preview.tags.map((t) => (
            <span
              key={t}
              className="inline-flex max-w-full items-center rounded-full border border-border-subtle/80 bg-surface px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
