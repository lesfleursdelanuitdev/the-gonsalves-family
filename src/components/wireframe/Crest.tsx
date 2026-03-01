import Image from "next/image";

const SIZE_MAP = {
  xs: "w-6 aspect-[2/3]",    // 24px wide
  sm: "w-10 aspect-[2/3]",   // 40px wide
  md: "w-16 aspect-[2/3]",   // 64px wide
  lg: "w-24 aspect-[2/3]",   // 96px wide
  xl: "w-32 aspect-[2/3]",   // 128px wide
  "2xl": "w-48 aspect-[2/3]",   // 192px wide
  "2.5xl": "w-56 aspect-[2/3]",  // 224px wide
  "3xl": "w-64 aspect-[2/3]",   // 256px wide
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
