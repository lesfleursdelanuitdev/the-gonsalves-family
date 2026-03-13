"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { ArrowRight, BookOpen, Lightbulb, Quote, Tag } from "lucide-react";

const cardSlideVariantsLeftMobile = {
  hidden: { opacity: 0, x: 48, rotate: 0 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const cardSlideVariantsLeftDesktop = {
  hidden: { opacity: 0, x: 48, rotate: 0 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const cardSlideVariantsRightMobile = {
  hidden: { opacity: 0, x: 48, rotate: 0 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const cardSlideVariantsRightDesktop = {
  hidden: { opacity: 0, x: 48, rotate: 0 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

type CultureColumnCardProps = {
  title: string;
  imageSrc?: string;
  middleSubtitle?: string;
  middleTitle?: React.ReactNode;
  middleDescription?: string;
  middleTags?: string[];
  middleTagsBgColor?: string;
  middleTagsTextColor?: string;
  middleBackgroundColor?: string;
  bottomLinkLabel?: string;
  bottomBackgroundColor?: string;
  bottomLinkHref?: string;
  bottomRadialGradient?: boolean;
  cardBottomGlow?: boolean;
  fadedCrimsonBorder?: boolean;
  cardBackgroundColor?: string;
  topRadialGradient?: boolean;
  topBottomLinearGradient?: boolean;
  topSubtitle?: string;
  topTitle?: string;
  topPronunciation?: string;
  topTitleTypewriter?: boolean;
  middleContent?: React.ReactNode;
  children?: React.ReactNode;
};

function CultureColumnCard({
  title,
  imageSrc,
  middleSubtitle,
  middleTitle,
  middleDescription,
  middleTags,
  middleTagsBgColor,
  middleTagsTextColor,
  middleBackgroundColor,
  bottomLinkLabel,
  bottomLinkHref,
  bottomBackgroundColor,
  bottomRadialGradient,
  cardBottomGlow,
  fadedCrimsonBorder,
  cardBackgroundColor,
  topRadialGradient,
  topBottomLinearGradient,
  topSubtitle,
  topTitle,
  topPronunciation,
  topTitleTypewriter,
  middleContent,
  children,
}: CultureColumnCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [typedLength, setTypedLength] = useState(0);
  const fullText = (typeof topTitle === "string" ? topTitle : "") || "";

  useEffect(() => {
    if (!topTitleTypewriter || !isHovered) return;
    if (typedLength >= fullText.length) return;
    const timer = setTimeout(() => setTypedLength((c) => c + 1), 80);
    return () => clearTimeout(timer);
  }, [topTitleTypewriter, isHovered, typedLength, fullText.length]);

  const displayTitle = topTitleTypewriter && fullText
    ? fullText.slice(0, isHovered ? typedLength : fullText.length)
    : topTitle;

  return (
    <div
      className={`group relative flex h-full min-h-0 flex-col overflow-hidden rounded-lg border shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all duration-300 hover:scale-[1.03] hover:border-border hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:bg-surface-elevated/80 dark:shadow-[0_2px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.14)] ${fadedCrimsonBorder ? "" : "border-border/60"} ${!cardBackgroundColor ? "bg-white/80 dark:bg-surface-elevated/80" : ""}`}
      onMouseEnter={() => {
        if (topTitleTypewriter) {
          setIsHovered(true);
          setTypedLength(0);
        }
      }}
      onMouseLeave={() => topTitleTypewriter && setIsHovered(false)}
      style={{
        ...(fadedCrimsonBorder
          ? { borderColor: "color-mix(in srgb, var(--crimson) 14%, transparent)" }
          : {}),
        ...(cardBackgroundColor ? { backgroundColor: cardBackgroundColor } : {}),
      }}
    >
      {cardBottomGlow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255,255,255,0.45) 0%, transparent 70%)",
          }}
          aria-hidden
        />
      )}
      <div
        className="group/img relative h-[220px] w-full shrink-0 overflow-hidden rounded-t-lg"
        style={
          !imageSrc && topRadialGradient
            ? {
                background:
                  "radial-gradient(circle at 50% 50%, white 0%, white 35%, #ede6d5 100%)",
              }
            : undefined
        }
      >
        {imageSrc ? (
          <>
          <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover/img:scale-110"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            {bottomRadialGradient && (
              <div
                className="pointer-events-none absolute inset-0 rounded-t-lg"
                style={{
                  background:
                    "linear-gradient(to top, #ede6d5 0%, transparent 80%)",
                }}
                aria-hidden
              />
            )}
          </>
        ) : null}
        {!imageSrc && topBottomLinearGradient && (
          <div
            className="pointer-events-none absolute inset-0 rounded-t-lg"
            style={{
              background:
                "linear-gradient(to top, #ede6d5 0%, transparent 100%)",
            }}
            aria-hidden
          />
        )}
        {!imageSrc && (topSubtitle || topTitle || topPronunciation) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1">
            {topSubtitle && (
              <p className="section-subtitle text-sm">{topSubtitle}</p>
            )}
            {(displayTitle ?? topTitle) && (
              <h3 className="font-heading text-5xl font-semibold tracking-tight text-heading md:text-7xl">
                {displayTitle ?? topTitle}
                {topTitleTypewriter && isHovered && typedLength < fullText.length && (
                  <span className="animate-pulse" aria-hidden>|</span>
                )}
              </h3>
            )}
            {topPronunciation && (
              <p className="font-body text-lg italic text-text/80 md:text-xl">
                {topPronunciation}
              </p>
            )}
          </div>
        )}
      </div>
      <div
        className="shrink-0 px-6 py-5"
        style={
          middleBackgroundColor
            ? { background: middleBackgroundColor }
            : undefined
        }
      >
        {middleSubtitle && (
          <p className="section-subtitle mb-1 text-sm">{middleSubtitle}</p>
        )}
        {middleContent ? (
          <div className="mt-2 font-body text-sm leading-relaxed text-text/90">
            {middleContent}
          </div>
        ) : (
          <>
            {middleTitle && (
              <h3 className="font-heading text-xl font-semibold tracking-tight text-heading md:text-2xl">
                {middleTitle}
              </h3>
            )}
            {middleDescription && (
              <p className="mt-2 font-body text-sm leading-relaxed text-text/90">
                {middleDescription}
              </p>
            )}
            {middleTags && middleTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {middleTags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs font-medium ${!middleTagsBgColor && !middleTagsTextColor ? "bg-text/8 text-text/80" : ""}`}
                    style={{
                      ...(middleTagsBgColor ? { backgroundColor: middleTagsBgColor } : {}),
                      ...(middleTagsTextColor ? { color: middleTagsTextColor } : {}),
                    }}
                  >
                    {tag}
                    <Tag className="h-3 w-3 shrink-0" aria-hidden />
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="min-h-0 flex-1" />
      {bottomLinkLabel && bottomLinkHref ? (
        <div
          className="mt-auto flex shrink-0 justify-end px-6 py-5"
          style={
            bottomBackgroundColor
              ? { background: bottomBackgroundColor }
              : undefined
          }
        >
          <Link
            href={bottomLinkHref}
            className="group/link font-body inline-flex items-center gap-2 text-lg font-medium text-link underline hover:text-link-hover"
          >
            {bottomLinkLabel}
            <ArrowRight
              className="card-link-arrow-mobile h-5 w-5 shrink-0 transition-transform duration-300 ease-out group-hover/link:translate-x-1.5 md:animate-none"
              aria-hidden
            />
          </Link>
        </div>
      ) : (
        <h3 className="font-heading text-lg font-semibold tracking-tight text-heading">
          {title}
        </h3>
      )}
      {children && (
        <div className="mt-2 font-body text-sm leading-relaxed text-text/90">
          {children}
        </div>
      )}
    </div>
  );
}

export function CultureColumns() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = () => setIsDesktop(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4 items-stretch"
      aria-label="Culture columns"
    >
      <motion.div
        className="h-full min-h-0"
        variants={isDesktop ? cardSlideVariantsLeftDesktop : cardSlideVariantsLeftMobile}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ delay: 0 }}
      >
        <CultureColumnCard
        title="Recipes"
        cardBackgroundColor="#ede7d6"
        imageSrc="/images/pepperpot.png"
        middleSubtitle="recipes"
        middleTitle={
          <>
            Guyanese <span className="italic">Pepperpot</span>
          </>
        }
        middleDescription="Pepperpot is a traditional Guyanese stew of slow-cooked beef simmered in cassareep, producing a rich, dark sauce and deeply layered flavor."
        middleTags={["Guyanese", "stew", "beef"]}
        middleTagsBgColor="rgba(34, 85, 51, 0.08)"
        middleTagsTextColor="#166534"
        middleBackgroundColor="#ede6d5"
        bottomBackgroundColor="color-mix(in srgb, #e5dcc8 60%, transparent)"
        bottomLinkLabel="Read recipe"
        bottomLinkHref="/culture"
        bottomRadialGradient
        fadedCrimsonBorder
      />
      </motion.div>
      <motion.div
        className="h-full min-h-0"
        variants={isDesktop ? cardSlideVariantsRightDesktop : cardSlideVariantsRightMobile}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ delay: 0.1 }}
      >
        <CultureColumnCard
        title="Language"
        cardBackgroundColor="#ede6d5"
        topSubtitle="language"
        topRadialGradient
        topBottomLinearGradient
        topTitle="pickney"
        topTitleTypewriter
        topPronunciation="PIK-nee"
        middleContent={
          <>
            <p className="flex w-full items-center gap-2 rounded-lg bg-black/5 px-3 py-1.5 text-left text-sm font-medium text-text">
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
              Definition
            </p>
            <p className="mt-1">A child.</p>
            <p className="mt-3 flex w-full items-center gap-2 rounded-lg bg-black/5 px-3 py-1.5 text-left text-sm font-medium text-text">
              <Quote className="h-4 w-4 shrink-0" aria-hidden />
              Usage
            </p>
            <p className="mt-1">&ldquo;The pickney dem playing in the yard.&rdquo;</p>
            <p className="mt-3 flex w-full items-center gap-2 rounded-lg bg-black/5 px-3 py-1.5 text-left text-sm font-medium text-text">
              <Lightbulb className="h-4 w-4 shrink-0" aria-hidden />
              Meaning
            </p>
            <p className="mt-1">The kids are playing in the yard.</p>
          </>
        }
        middleBackgroundColor="#ede6d5"
        bottomBackgroundColor="color-mix(in srgb, #e5dcc8 60%, transparent)"
        bottomLinkLabel="Learn more language"
        bottomLinkHref="/culture"
        bottomRadialGradient
        fadedCrimsonBorder
      />
      </motion.div>
    </div>
  );
}
