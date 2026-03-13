"use client";

import {
  useTreeIndividuals,
  useTreeFamilies,
  useTreeSurnames,
  useTreePlaces,
  useTreeRandomIndividual,
  useTreeRandomFamily,
  useTreeRandomPlace,
  useTreeRandomSurname,
} from "@/hooks/useTreeData";
import { motion, useInView } from "motion/react";
import { User, UsersRound, Type, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1500;
const STAGGER_MS = 120;
const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

function useCountUp(end: number, enabled: boolean, delayMs = 0): number {
  const [display, setDisplay] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof end !== "number") return;
    rafIdRef.current = null;

    const timeoutId = setTimeout(() => {
      startTimeRef.current = null;
      const step = (now: number) => {
        const start = startTimeRef.current ?? now;
        startTimeRef.current = start;
        const elapsed = now - start;
        const t = Math.min(elapsed / DURATION_MS, 1);
        const eased = EASE_OUT_CUBIC(t);
        setDisplay(Math.round(eased * end));
        if (t < 1) rafIdRef.current = requestAnimationFrame(step);
      };
      rafIdRef.current = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [end, enabled, delayMs]);

  return display;
}

/**
 * Statistics — stats/summary section for the homepage.
 * Shows counts for individuals, families, surnames, and places.
 */
export function Statistics() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const { data: individuals, isPending: individualsPending } = useTreeIndividuals();
  const { data: families, isPending: familiesPending } = useTreeFamilies();
  const { data: surnames, isPending: surnamesPending } = useTreeSurnames();
  const { data: places, isPending: placesPending } = useTreePlaces();

  const { data: randomIndividual, refetch: refetchRandomIndividual } = useTreeRandomIndividual();
  const { data: randomFamily, refetch: refetchRandomFamily } = useTreeRandomFamily();
  const { data: randomPlace, refetch: refetchRandomPlace } = useTreeRandomPlace();
  const { data: randomSurname, refetch: refetchRandomSurname } = useTreeRandomSurname();

  const handleRandomize = () => {
    void refetchRandomIndividual();
    void refetchRandomFamily();
    void refetchRandomPlace();
    void refetchRandomSurname();
  };

  const n = individuals?.length ?? 0;
  const x = families?.length ?? 0;
  const y = surnames?.length ?? 0;
  const z = places?.length ?? 0;

  const displayN = useCountUp(n, isInView && !individualsPending, 0);
  const displayX = useCountUp(x, isInView && !familiesPending, STAGGER_MS);
  const displayY = useCountUp(y, isInView && !surnamesPending, STAGGER_MS * 2);
  const displayZ = useCountUp(z, isInView && !placesPending, STAGGER_MS * 3);

  const individualDisplayName =
    randomIndividual &&
    [randomIndividual.firstName, randomIndividual.lastName].filter(Boolean).join(" ").trim();
  const placeDisplayName =
    randomPlace?.original ?? randomPlace?.name ?? randomPlace?.country ?? null;

  const familyDisplayName = randomFamily
    ? [randomFamily.husbandName, randomFamily.wifeName].filter(Boolean).join(" & ").trim() ||
      "one of many"
    : null;

  const stats = [
    {
      value: individualsPending ? "—" : displayN,
      label: "Individuals Documented",
      icon: User,
      example: individualDisplayName || null,
      exampleHref: randomIndividual ? `/tree/viewer?xref=${encodeURIComponent(randomIndividual.xref)}` : null,
    },
    {
      value: familiesPending ? "—" : displayX,
      label: "Families Connected",
      icon: UsersRound,
      example: familyDisplayName,
      exampleHref: randomFamily ? "/tree/families" : null,
    },
    {
      value: surnamesPending ? "—" : displayY,
      label: "Surnames Recorded",
      icon: Type,
      example: randomSurname?.surname ?? null,
      exampleHref: randomSurname ? "/tree/surnames" : null,
    },
    {
      value: placesPending ? "—" : displayZ,
      label: "Places Across the World",
      icon: MapPin,
      example: placeDisplayName,
      exampleHref: randomPlace ? "/tree/places" : null,
    },
  ];

  return (
    <section className="w-full max-w-full min-w-0 overflow-x-hidden py-0">
      <div className="relative w-full max-w-full min-w-0">
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-black/5"
          aria-hidden
        />
        <div ref={sectionRef} className="relative z-10 min-w-0 max-w-full">
      <div className="px-5 py-4 md:px-10">
        <p className="section-subtitle mb-2 mt-12 text-sm md:text-base">By the numbers</p>
        <h2 className="mb-4 font-heading text-2xl font-semibold tracking-tight text-heading md:text-4xl">
          Family <span className="italic">Statistics</span>
        </h2>
        <p className="font-body max-w-2xl text-lg leading-relaxed text-text md:text-xl">
          Key figures from the Gonsalves family tree.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRandomize}
            className="font-body inline-flex items-center justify-center rounded-lg border border-primary bg-transparent px-6 py-3 text-base font-semibold text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-focus-ring transition-colors"
          >
            Randomize
          </button>
          <Link
            href="/tree/statistics"
            className="font-body inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow focus:outline-none focus:ring-2 focus:ring-focus-ring transition-shadow"
          >
            Explore Statistics…
          </Link>
        </div>
      </div>
      <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 px-3 sm:grid-cols-2 sm:gap-4 sm:px-0 lg:grid-cols-4 lg:gap-4 bg-primary/8 md:mt-8">
        {stats.map(({ value, label, icon: Icon, example, exampleHref }, index) => {
          const hasOverlay = index === 1 || index === 3;
          return (
          <div
            key={label}
            className="relative flex min-w-0 flex-col items-center justify-center py-4 text-center md:py-6"
          >
            {hasOverlay && (
              <div
                className="pointer-events-none absolute inset-0 z-0 bg-black/3"
                aria-hidden
              />
            )}
            <div className="relative z-10 flex flex-col items-center py-4 md:py-6">
            <div
              className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/20 opacity-50 md:mb-3 md:size-12"
              aria-hidden
            >
              <Icon
                size={22}
                className="text-primary"
                strokeWidth={1.75}
              />
            </div>
            <span className="font-body text-4xl font-semibold tracking-wide text-primary-hover min-w-0 md:text-5xl lg:text-6xl">
              {value}
            </span>
            <p className="section-subtitle mt-2 break-words text-sm md:text-base">
              {label}
            </p>
            {example && (
              <motion.p
                key={`${label}-${example}`}
                className="mt-1 text-xs text-text/80 md:text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                {exampleHref ? (
                  <Link
                    href={exampleHref}
                    className="underline hover:text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring rounded"
                  >
                    e.g. {example}
                  </Link>
                ) : (
                  <>e.g. {example}</>
                )}
              </motion.p>
            )}
            </div>
          </div>
          );
        })}
      </div>
        </div>
      </div>
    </section>
  );
}
