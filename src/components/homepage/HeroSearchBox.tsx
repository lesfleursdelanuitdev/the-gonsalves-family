"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { GitBranch, Search } from "lucide-react";

const TYPING_PHRASES = [
  "Gonsalves",
  "Guyana",
  "childhood stories",
  "Guyanese pepperpot recipe",
  "Augustino Gracis",
];
const TYPING_CHAR_DELAY_MS = 80;
const PAUSE_BETWEEN_PHRASES_MS = 1200;
const CLEAR_DELAY_MS = 400;
const CURSOR_BLINK_MS = 530;

/** Mockup-aligned heritage palette (hero search only). */
const H = {
  green: "#2E5E3E",
  red: "#8F1F1F",
  ivory: "#FFF8E8",
  gold: "#C9B37A",
  ink: "#2B2924",
} as const;

type HeroSearchBoxProps = {
  triggerTyping?: boolean;
};

function SearchingCategories() {
  const dot = (
    <span className="mx-0.5 inline text-[11px] font-light sm:text-xs" style={{ color: H.gold }}>
      •
    </span>
  );
  return (
    <p className="mt-3 text-center font-body text-[10px] leading-relaxed tracking-wide sm:mt-4 sm:text-[11px]">
      <span className="font-medium text-[color:var(--text-muted)]">Searching:</span>{" "}
      <span className="font-semibold" style={{ color: H.green }}>
        people
      </span>
      {dot}
      <span className="font-semibold" style={{ color: H.red }}>
        places
      </span>
      {dot}
      <span className="font-semibold" style={{ color: H.green }}>
        surnames
      </span>
      {dot}
      <span className="font-semibold" style={{ color: H.red }}>
        stories
      </span>
      {dot}
      <span className="font-semibold" style={{ color: H.green }}>
        timelines
      </span>
    </p>
  );
}

export function HeroSearchBox({ triggerTyping = false }: HeroSearchBoxProps) {
  const [focused, setFocused] = useState(false);
  const [typedValue, setTypedValue] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "typing" | "pause" | "clearing">("idle");
  const [hasCompletedTyping, setHasCompletedTyping] = useState(false);
  const [userHasTyped, setUserHasTyped] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const programmaticFocusRef = useRef(false);

  useEffect(() => {
    if (triggerTyping && inputRef.current) {
      programmaticFocusRef.current = true;
      inputRef.current.focus();
      setFocused(true);
    }
  }, [triggerTyping]);

  useEffect(() => {
    if (hasCompletedTyping && inputRef.current) {
      inputRef.current.blur();
      setFocused(false);
    }
  }, [hasCompletedTyping]);

  useEffect(() => {
    const timer = setInterval(() => setCursorVisible((v) => !v), CURSOR_BLINK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!triggerTyping || userHasTyped || hasCompletedTyping) return;

    if (phase === "idle") {
      setPhase("typing");
      return;
    }

    if (phase === "typing") {
      const phrase = TYPING_PHRASES[phraseIndex];
      if (typedValue.length >= phrase.length) {
        if (phraseIndex >= TYPING_PHRASES.length - 1) {
          setHasCompletedTyping(true);
          setPhase("idle");
          return;
        }
        setPhase("pause");
        return;
      }
      const timer = setTimeout(
        () => setTypedValue(phrase.slice(0, typedValue.length + 1)),
        TYPING_CHAR_DELAY_MS
      );
      return () => clearTimeout(timer);
    }

    if (phase === "pause") {
      const timer = setTimeout(() => setPhase("clearing"), PAUSE_BETWEEN_PHRASES_MS);
      return () => clearTimeout(timer);
    }

    if (phase === "clearing") {
      const timer = setTimeout(() => {
        setTypedValue("");
        setPhraseIndex((i) => i + 1);
        setPhase("typing");
      }, CLEAR_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [triggerTyping, typedValue, phraseIndex, phase, userHasTyped, hasCompletedTyping]);

  const handleBlur = () => {
    setTimeout(() => {
      if (formRef.current && !formRef.current.contains(document.activeElement)) {
        setFocused(false);
      }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserHasTyped(true);
    setTypedValue(e.target.value);
  };

  const showPlaceholder = !typedValue && !triggerTyping;
  const showCursor = triggerTyping && !userHasTyped && !hasCompletedTyping;

  const inputPadLeft = "pl-10 sm:pl-11";

  return (
    <motion.div
      className="w-full max-w-[min(100%,22.5rem)] sm:max-w-[min(100%,36rem)] origin-center"
      animate={{ scale: focused ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      <div
        className="rounded-xl border bg-[rgba(240,226,204,0.47)] px-4 pb-4 pt-3 shadow-[0_2px_10px_rgba(45,32,18,0.1),0_12px_40px_rgba(45,32,18,0.14),0_24px_56px_-10px_rgba(45,32,18,0.12)] backdrop-blur-md sm:px-5 sm:pb-5 sm:pt-4"
        style={{
          WebkitBackdropFilter: "blur(14px)",
          backdropFilter: "blur(14px)",
          borderColor: H.gold,
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3" aria-hidden="true">
          <div className="h-px min-w-[1.25rem] flex-1 bg-[color-mix(in_srgb,#C9B37A_75%,transparent)] sm:min-w-[2rem]" />
          <span
            className="shrink-0 text-center font-body text-[10px] font-semibold uppercase tracking-[0.22em] sm:text-[11px]"
            style={{ color: H.red }}
          >
            Search the Family Archive
          </span>
          <div className="h-px min-w-[1.25rem] flex-1 bg-[color-mix(in_srgb,#C9B37A_75%,transparent)] sm:min-w-[2rem]" />
        </div>

        <form
          ref={formRef}
          id="hero-archive-search"
          action="/tree/viewer/searchDatabase"
          method="GET"
          className="mt-3 flex min-w-0 flex-col divide-y divide-[color-mix(in_srgb,#C9B37A_65%,transparent)] overflow-hidden rounded-lg border max-sm:divide-y-0 sm:mt-4 sm:flex-row sm:divide-x sm:divide-y-0"
          style={{ borderColor: H.gold }}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
        >
          <label htmlFor="hero-search-q" className="sr-only">
            Search the family archive
          </label>
          <div
            className="relative flex min-h-[3rem] min-w-0 flex-1 items-center pr-4 sm:min-h-[3rem]"
            style={{ backgroundColor: H.ivory }}
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 sm:left-3.5"
              size={18}
              strokeWidth={2}
              style={{ color: H.green }}
              aria-hidden
            />
            <input
              ref={inputRef}
              id="hero-search-q"
              type="text"
              name="q"
              title="Press Enter to search"
              value={typedValue}
              onChange={handleInputChange}
              placeholder={
                showPlaceholder
                  ? "Search people, places, surnames, stories, timelines…"
                  : ""
              }
              className={`w-full min-w-0 bg-transparent py-3 pr-1 text-sm outline-none placeholder:text-[color:var(--text-subtle)] sm:py-3.5 sm:text-sm ${inputPadLeft} ${
                showCursor ? "text-transparent caret-transparent" : "text-[color:var(--text)]"
              }`}
              style={{ color: showCursor ? undefined : H.ink }}
              onFocus={() => {
                if (programmaticFocusRef.current) {
                  programmaticFocusRef.current = false;
                } else if (showCursor) {
                  setUserHasTyped(true);
                }
              }}
            />
            {showCursor && (
              <div
                className={`pointer-events-none absolute left-0 top-0 flex h-full items-center ${inputPadLeft} pr-4`}
                aria-hidden
              >
                <span className="whitespace-pre text-sm text-[color:var(--text)] sm:text-sm">
                  {typedValue}
                  <span
                    className={`inline-block transition-opacity duration-75 ${
                      cursorVisible ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    |
                  </span>
                </span>
              </div>
            )}
          </div>
          <button
            type="submit"
            className="hidden min-h-[3rem] w-full shrink-0 items-center justify-center gap-2 bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C3A45A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6EFE1] sm:flex sm:min-h-[3rem] sm:w-auto sm:min-w-0 sm:px-5 sm:py-3 sm:text-[11px]"
          >
            Search
            <GitBranch size={14} strokeWidth={2} className="opacity-95" aria-hidden />
          </button>
        </form>

        <SearchingCategories />
      </div>
    </motion.div>
  );
}
