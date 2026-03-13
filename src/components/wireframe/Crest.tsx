import Image from "next/image";

/* crest.png is 986×1216 px — use its aspect ratio to avoid object-contain letterboxing */
const CREST_ASPECT = "aspect-[986/1216]";

const SIZE_MAP = {
  xs: `w-6 ${CREST_ASPECT}`,
  sm: `w-10 ${CREST_ASPECT}`,
  md: `w-16 ${CREST_ASPECT}`,
  lg: `w-24 ${CREST_ASPECT}`,
  xl: `w-32 ${CREST_ASPECT}`,
  "2xl": `w-48 ${CREST_ASPECT}`,
  "2.5xl": `w-56 ${CREST_ASPECT}`,
  "3xl": `w-64 ${CREST_ASPECT}`,
} as const;

type CrestSize = keyof typeof SIZE_MAP;

type CrestProps = {
  size?: CrestSize;
  priority?: boolean;
  alt?: string;
  framed?: boolean;
};

export function Crest({
  size = "sm",
  priority = false,
  alt = "",
  framed = false,
}: CrestProps) {
  const inner = (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden ${SIZE_MAP[size]}`}
      aria-hidden={!alt}
    >
      <Image
        src="/images/crest.png"
        alt={alt}
        fill
        className="object-contain"
        sizes="(max-width: 768px) 192px, 256px"
        priority={priority}
      />
    </div>
  );

  if (framed) {
    return (
      <div className="rounded-xl border border-crest-border bg-crest-bg p-2 shadow-sm">
        {inner}
      </div>
    );
  }

  return inner;
}
