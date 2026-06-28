"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";

import type { HomeArticleSpotlight } from "@/lib/stories/load-home-article-spotlight";

const CULTURE_TABS = ["All", "Food", "Language", "Articles"] as const;
type CultureTab = (typeof CULTURE_TABS)[number];
type CultureCategory = Exclude<CultureTab, "All">;

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.08,
      duration: 0.55,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

type CultureFeatureCard = {
  kind: CultureCategory;
  ribbon: string;
  imageSrc?: string;
  heroText?: string;
  heroPronunciation?: string;
  initials?: string;
  category: string;
  title: ReactNode;
  description: string;
  details?: Array<{ label: string; value: string }>;
  href: string;
};

const STATIC_CULTURE_CARDS: CultureFeatureCard[] = [
  {
    kind: "Food",
    ribbon: "Stew / Beef / 12 hrs",
    imageSrc: "/images/pepperpot.png",
    category: "Guyanese",
    title: "Pepperpot",
    description: "Slow-cooked beef in cassareep - dark, layered, deeply Guyanese.",
    href: "/culture",
  },
  {
    kind: "Language",
    ribbon: "Creolese / Word",
    heroText: "pickney",
    heroPronunciation: "PIK-nee",
    category: "Language",
    title: "Pickney",
    description: "A child.",
    details: [
      { label: "Usage", value: "The pickney dem playing in the yard." },
      { label: "Meaning", value: "The kids are playing in the yard." },
    ],
    href: "/culture",
  },
];

function articleCultureCard(article: HomeArticleSpotlight): CultureFeatureCard {
  return {
    kind: "Articles",
    ribbon: "Article / Profile",
    imageSrc: article.coverUrl,
    category: "Article",
    title: article.title,
    description: article.excerpt,
    href: article.href,
  };
}

function buildCultureCards(articleSpotlight: HomeArticleSpotlight | null): CultureFeatureCard[] {
  const articleCard = articleSpotlight ? articleCultureCard(articleSpotlight) : null;
  if (!articleCard) {
    return STATIC_CULTURE_CARDS;
  }
  return [
    STATIC_CULTURE_CARDS[0]!,
    STATIC_CULTURE_CARDS[1]!,
    articleCard,
  ];
}

function CultureFeatureCard({
  ribbon,
  imageSrc,
  heroText,
  heroPronunciation,
  initials,
  category,
  title,
  description,
  details,
  href,
}: CultureFeatureCard) {
  const hero = imageSrc ? (
    <Image
      src={imageSrc}
      alt=""
      fill
      className="object-cover transition duration-500 group-hover:scale-105"
      sizes="(max-width: 768px) 70vw, 23vw"
    />
  ) : heroText ? (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center"
      style={{
        background:
          "radial-gradient(circle at 50% 48%, rgba(255,255,255,0.68), rgba(247,241,228,0.52) 42%, rgba(229,216,190,0.9) 100%)",
      }}
    >
      <span className="font-heading text-3xl font-semibold italic tracking-tight text-heading sm:text-4xl lg:text-5xl">
        {heroText}
      </span>
      {heroPronunciation ? (
        <span className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {heroPronunciation}
        </span>
      ) : null}
    </div>
  ) : (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 50% 48%, rgba(255,255,255,0.68), rgba(247,241,228,0.52) 42%, rgba(229,216,190,0.9) 100%)",
      }}
    >
      <span className="font-heading text-5xl font-semibold italic tracking-tight text-crimson/70 lg:text-6xl">
        {initials}
      </span>
    </div>
  );

  return (
    <article className="group flex h-full min-h-[18rem] flex-col overflow-hidden rounded-sm border border-border-subtle/80 bg-surface-elevated/90 shadow-[0_10px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(60,45,25,0.12)]">
      <div className="relative h-36 overflow-hidden border-b border-border-subtle/70 bg-surface-2 sm:h-32">
        {hero}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/25 to-transparent" aria-hidden />
        <p className="absolute left-3 top-3 bg-crimson px-2 py-1 font-body text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
          {ribbon}
        </p>
      </div>

      <div className="flex flex-1 flex-col px-4 py-5">
        <p className="font-body text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-muted">
          {category}
        </p>
        <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-heading">
          {title}
        </h3>
        <p className="mt-4 flex-1 font-body text-sm leading-relaxed text-text/80">
          {description}
        </p>
        {details && details.length > 0 ? (
          <div className="mt-4 space-y-2 border-t border-border-subtle/70 pt-3">
            {details.map((detail) => (
              <p key={detail.label} className="font-body text-xs leading-relaxed text-text/80">
                <span className="mr-2 font-semibold uppercase tracking-[0.14em] text-crimson">
                  {detail.label}
                </span>
                {detail.value}
              </p>
            ))}
          </div>
        ) : null}
        <Link
          href={href}
          className="mt-5 inline-flex w-fit items-center gap-2 font-body text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-link transition hover:text-link-hover"
        >
          Read more
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export function CultureColumns({
  articleSpotlight = null,
}: {
  articleSpotlight?: HomeArticleSpotlight | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const [activeTab, setActiveTab] = useState<CultureTab>("All");
  const cultureCards = buildCultureCards(articleSpotlight);
  const visibleCards = activeTab === "All"
    ? cultureCards
    : cultureCards.filter((card) => card.kind === activeTab);

  return (
    <div
      ref={containerRef}
      className="min-w-0"
      aria-label="Culture features"
    >
      <div
        aria-label="Culture categories"
        role="tablist"
        className="mb-6 flex min-w-0 items-center gap-6 overflow-x-auto border-b border-border-subtle/85 pb-3"
      >
        {CULTURE_TABS.map((tab) => {
          const selected = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab)}
              className={`font-body text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition hover:text-link ${
                selected
                  ? "border-b-2 border-crimson pb-3 text-crimson"
                  : "pb-3 text-text/70"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map((card, index) => (
          <motion.div
            key={`${card.kind}-${card.category}`}
            className="min-w-0"
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <CultureFeatureCard {...card} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
